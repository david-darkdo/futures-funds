import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";
const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SYSTEM_PROMPT = `You are a luxury financial brand copywriter for Future Funds, a premium crypto investment platform. Brand voice: confident, elegant, professional, concise. Visual identity: dark navy backgrounds with gold (#c9a84c) and teal accents.

Output STRICT JSON with this shape:
{
  "subject": "concise compelling subject line under 70 chars",
  "body_html": "the email body content as inline-styled HTML. Use <p>, <h3>, <ul>, <strong>. Use color #c5d0dc for body text, #c9a84c for accents. No <html>/<head>/<body>. No <style>. No external links. Do NOT include greetings or sign-offs — those are added by the template. Keep under 400 words. Avoid emoji.",
  "image_prompt": "a one-sentence description of a single hero image that fits this email. Style: dark navy luxury banking, gold & teal accents, abstract, high-end financial aesthetic, no text in image."
}

Only return the JSON object, no markdown fences, no commentary.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify caller is an admin
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { prompt, includeImage = true } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "prompt required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 1) generate text JSON
    const textRes = await fetch(GATEWAY, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!textRes.ok) {
      const errBody = await textRes.text();
      console.error("[admin-compose-email] text gen failed:", textRes.status, errBody);
      return new Response(JSON.stringify({ error: `AI text failed: ${textRes.status}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const textJson = await textRes.json();
    const raw = textJson?.choices?.[0]?.message?.content || "{}";
    let parsed: { subject: string; body_html: string; image_prompt: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { subject: "Future Funds Update", body_html: `<p>${raw}</p>`, image_prompt: prompt };
    }

    let imageDataUrl: string | null = null;
    if (includeImage && parsed.image_prompt) {
      const imgRes = await fetch(GATEWAY, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${LOVABLE_API_KEY}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: parsed.image_prompt }],
          modalities: ["image", "text"],
        }),
      });
      if (imgRes.ok) {
        const imgJson = await imgRes.json();
        const imgUrl = imgJson?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (typeof imgUrl === "string") imageDataUrl = imgUrl;
      } else {
        console.warn("[admin-compose-email] image gen failed:", imgRes.status);
      }
    }

    return new Response(
      JSON.stringify({
        subject: parsed.subject,
        bodyHtml: parsed.body_html,
        imageDataUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[admin-compose-email] error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
