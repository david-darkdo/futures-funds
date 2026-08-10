import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChatSession, ChatMessage } from "@/types/chat";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/live-chat`;

async function callChatFn(payload: Record<string, unknown>) {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useLiveChat() {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const initializing = useRef(false);

  const getVisitorId = useCallback(() => {
    let vid = localStorage.getItem("ff_visitor_id");
    if (!vid) {
      vid = "v_" + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
      localStorage.setItem("ff_visitor_id", vid);
    }
    return vid;
  }, []);

  const mergeMessages = useCallback((incoming: ChatMessage[]) => {
    setMessages((prev) => {
      const map = new Map<string, ChatMessage>();
      [...prev, ...incoming].forEach((m) => map.set(m.id, m));
      return Array.from(map.values()).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    });
  }, []);

  const initSession = useCallback(async () => {
    if (initializing.current) return;
    initializing.current = true;
    try {
      const data = await callChatFn({
        action: "init",
        visitor_id: getVisitorId(),
        user_id: user?.id || null,
        visitor_email: user?.email || null,
        visitor_name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || null,
      });
      if (data?.session) {
        setCurrentSession(data.session as ChatSession);
        mergeMessages((data.messages || []) as ChatMessage[]);
      }
    } catch (e) {
      console.error("Failed to init chat session", e);
    } finally {
      initializing.current = false;
    }
  }, [user, getVisitorId, mergeMessages]);

  // Realtime for agent/admin replies (works for signed-in clients)
  useEffect(() => {
    if (!currentSession?.id) return;

    const channel = supabase
      .channel(`chat_${currentSession.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `session_id=eq.${currentSession.id}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          if (newMsg.sender_type === "agent") mergeMessages([newMsg]);
        },
      )
      .subscribe();

    // Polling fallback (covers anonymous visitors without realtime read access)
    const interval = setInterval(async () => {
      try {
        const data = await callChatFn({ action: "history", session_id: currentSession.id });
        if (data?.session) setCurrentSession(data.session as ChatSession);
        if (data?.messages) {
          const agentMsgs = (data.messages as ChatMessage[]).filter((m) => m.sender_type === "agent");
          if (agentMsgs.length) mergeMessages(agentMsgs);
        }
      } catch {
        /* ignore */
      }
    }, 8000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [currentSession?.id, mergeMessages]);

  const sendMessage = async (content: string, attachments: string[] = []) => {
    const trimmed = content.trim();
    if (!trimmed && attachments.length === 0) return;

    let session = currentSession;
    if (!session) {
      await initSession();
      session = currentSession;
    }

    const optimistic: ChatMessage = {
      id: "local_" + Date.now(),
      session_id: session?.id || "pending",
      sender_type: "user",
      sender_name: user?.email?.split("@")[0] || "Valued Client",
      content: trimmed,
      attachments,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setLoading(true);

    try {
      const data = await callChatFn({
        action: "send",
        session_id: session?.id,
        content: trimmed,
        attachments,
        sender_name: optimistic.sender_name,
      });

      // swap optimistic message for the stored one
      if (data?.user_message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? (data.user_message as ChatMessage) : m)),
        );
      }

      if (data?.reply) {
        // Human-like typing pause before the reply appears (3 - 4.5 seconds)
        await wait(3000 + Math.random() * 1500);
        mergeMessages([data.reply as ChatMessage]);
      }
    } catch (e) {
      console.error("Error in sendMessage", e);
    } finally {
      setLoading(false);
    }
  };

  return {
    currentSession,
    messages,
    loading,
    initSession,
    sendMessage,
  };
}
