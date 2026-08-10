import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const FALLBACK_PROMPT = `You are the Futures Funds Client Support Assistant on the live chat of Futures Funds, a private investment and futures trading firm. Be warm, human and concise. Greet the client by name once, ask how you can help, ask clarifying questions until you fully understand the request, then tell them you are connecting them with Alexander and Pamela on the senior management desk who will follow up shortly. Never repeat the greeting or the handoff message.`;

async function callModel(system: string, history: { role: string; content: string }[]) {
  const input = [
    { role: "developer", content: [{ type: "input_text", text: system }] },
    ...history.map((m) =>
      m.role === "assistant"
        ? { role: "assistant", content: [{ type: "output_text", text: m.content }] }
        : { role: "user", content: [{ type: "input_text", text: m.content }] },
    ),
  ];

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": LOVABLE_API_KEY,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-5.6-sol",
      input,
      stream: true,
      store: false,
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`gateway_${res.status}: ${detail.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload);
        if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
          text += evt.delta;
        } else if (evt.type === "response.completed" && !text) {
          text = evt.response?.output_text ?? "";
        }
      } catch {
        // ignore keep-alive / partial frames
      }
    }
  }

  return text.trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const action = body?.action as string;

    // ---------- INIT ----------
    if (action === "init") {
      const visitorId = String(body.visitor_id || "").slice(0, 80);
      if (!visitorId) return json({ error: "visitor_id required" }, 400);

      let { data: session } = await admin
        .from("chat_sessions")
        .select("*")
        .eq("visitor_id", visitorId)
        .maybeSingle();

      if (!session) {
        const { data: created, error } = await admin
          .from("chat_sessions")
          .insert({
            visitor_id: visitorId,
            user_id: body.user_id || null,
            visitor_email: body.visitor_email || null,
            visitor_name: body.visitor_name || null,
            status: "ai_active",
          })
          .select("*")
          .single();
        if (error) return json({ error: error.message }, 500);
        session = created;
      } else if (body.user_id && !session.user_id) {
        const { data: updated } = await admin
          .from("chat_sessions")
          .update({
            user_id: body.user_id,
            visitor_email: body.visitor_email || session.visitor_email,
            visitor_name: body.visitor_name || session.visitor_name,
          })
          .eq("id", session.id)
          .select("*")
          .single();
        if (updated) session = updated;
      }

      const { data: messages } = await admin
        .from("chat_messages")
        .select("*")
        .eq("session_id", session!.id)
        .order("created_at", { ascending: true });

      return json({ session, messages: messages ?? [] });
    }

    // ---------- HISTORY ----------
    if (action === "history") {
      const sessionId = String(body.session_id || "");
      if (!sessionId) return json({ error: "session_id required" }, 400);
      const { data: session } = await admin.from("chat_sessions").select("*").eq("id", sessionId).maybeSingle();
      const { data: messages } = await admin
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      return json({ session, messages: messages ?? [] });
    }

    // ---------- SEND ----------
    if (action === "send") {
      const sessionId = String(body.session_id || "");
      const content = String(body.content || "").trim().slice(0, 4000);
      const attachments: string[] = Array.isArray(body.attachments)
        ? body.attachments.map((a: unknown) => String(a)).slice(0, 10)
        : [];
      if (!sessionId || (!content && attachments.length === 0)) {
        return json({ error: "session_id and content required" }, 400);
      }

      const { data: session } = await admin.from("chat_sessions").select("*").eq("id", sessionId).maybeSingle();
      if (!session) return json({ error: "session not found" }, 404);

      const senderName = String(body.sender_name || session.visitor_name || "Valued Client").slice(0, 80);

      const { data: userMsg, error: insertErr } = await admin
        .from("chat_messages")
        .insert({ session_id: sessionId, sender_type: "user", sender_name: senderName, content, attachments })
        .select("*")
        .single();
      if (insertErr) return json({ error: insertErr.message }, 500);

      await admin
        .from("chat_sessions")
        .update({ last_message: content || "\u{1F4F7} Image", updated_at: new Date().toISOString() })
        .eq("id", sessionId);

      // Human agent has taken over -> no AI reply.
      if (session.status !== "ai_active") {
        return json({ user_message: userMsg, reply: null });
      }

      const { data: settings } = await admin
        .from("ai_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: history } = await admin
        .from("chat_messages")
        .select("sender_type, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .limit(40);

      const clientName =
        session.visitor_name ||
        (session.visitor_email ? String(session.visitor_email).split("@")[0] : "") ||
        "";

      const stateLines = [
        clientName ? `Client name: ${clientName}` : "Client name: unknown (do not invent one)",
        session.greeted
          ? "You have ALREADY greeted this client in a previous message. Do NOT greet again."
          : "This is your FIRST message to this client. Greet them warmly by name, thank them for reaching out to Futures Funds client support, and ask how you can help today.",
        session.handoff_sent
          ? "You have ALREADY told this client that Alexander and Pamela from management will follow up. Do NOT repeat that handoff message."
          : "You have NOT yet handed off. Keep asking clarifying questions until you fully understand the request, then hand off to Alexander and Pamela exactly once.",
        settings?.faqs_json && settings.faqs_json !== "[]" ? `Company FAQs: ${settings.faqs_json}` : "",
      ].filter(Boolean);

      const system = `${settings?.system_prompt || FALLBACK_PROMPT}

CURRENT CONVERSATION STATE
${stateLines.join("\n")}

Reply with the next chat message only - plain text, 1 to 3 sentences, no markdown, no signature.`;

      let reply = "";
      try {
        reply = await callModel(
          system,
          (history ?? []).map((m: any) => ({
            role: m.sender_type === "user" ? "user" : "assistant",
            content: m.content || "[client shared an image]",
          })),
        );
      } catch (e) {
        console.error("AI gateway error", e);
      }

      if (!reply) {
        reply = session.greeted
          ? "Thank you for that. Could you share a little more detail so I can direct this to the right desk?"
          : `Thank you for reaching out to Futures Funds client support${clientName ? `, ${clientName}` : ""}. How may we assist you today?`;
      }

      const handoffSignals = ["alexander", "pamela", "management team", "management desk", "follow up"];
      const lowered = reply.toLowerCase();
      const handoffNow = session.handoff_sent || handoffSignals.some((s) => lowered.includes(s));

      const { data: aiMsg } = await admin
        .from("chat_messages")
        .insert({
          session_id: sessionId,
          sender_type: "assistant",
          sender_name: "Futures Funds Support",
          content: reply,
        })
        .select("*")
        .single();

      await admin
        .from("chat_sessions")
        .update({
          greeted: true,
          handoff_sent: handoffNow,
          last_message: reply,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      return json({ user_message: userMsg, reply: aiMsg });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e: any) {
    console.error("live-chat error", e);
    return json({ error: e?.message || "unexpected error" }, 500);
  }
});
