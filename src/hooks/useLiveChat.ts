import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChatSession, ChatMessage } from "@/types/chat";

export function useLiveChat() {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const getVisitorId = useCallback(() => {
    let vid = localStorage.getItem("ff_visitor_id");
    if (!vid) {
      vid = "v_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("ff_visitor_id", vid);
    }
    return vid;
  }, []);

  const initSession = useCallback(async () => {
    const vid = getVisitorId();
    try {
      const { data: existing } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("visitor_id", vid)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        setCurrentSession(existing as ChatSession);
        fetchMessages(existing.id);
      } else {
        const { data: newSess, error } = await supabase
          .from("chat_sessions")
          .insert({
            visitor_id: vid,
            user_id: user?.id || null,
            visitor_email: user?.email || null,
            status: "ai_active",
          } as any)
          .select("*")
          .single();

        if (!error && newSess) {
          setCurrentSession(newSess as ChatSession);
        }
      }
    } catch (e) {
      console.error("Failed to init chat session", e);
    }
  }, [user, getVisitorId]);

  const fetchMessages = async (sessionId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    setMessages((data as ChatMessage[]) || []);
  };

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
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentSession?.id]);

  const sendMessage = async (content: string) => {
    if (!currentSession) return;
    setLoading(true);

    const userMsg = {
      session_id: currentSession.id,
      sender_type: "user",
      sender_name: user?.email?.split("@")[0] || "Client",
      content,
    };

    try {
      const { data: savedMsg } = await supabase
        .from("chat_messages")
        .insert(userMsg as any)
        .select("*")
        .single();

      if (savedMsg) {
        setMessages((prev) => [...prev, savedMsg as ChatMessage]);
      }

      if (currentSession.status === "ai_active") {
        await supabase.functions.invoke("chat-copilot", {
          body: {
            sessionId: currentSession.id,
            userMessage: content,
            userId: user?.id,
          },
        });
      }
    } catch (e) {
      console.error("Error sending message", e);
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
