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
        const newSessData = {
          visitor_id: vid,
          user_id: user?.id || null,
          visitor_email: user?.email || null,
          status: "ai_active",
        };

        const { data: newSess, error } = await supabase
          .from("chat_sessions")
          .insert(newSessData as any)
          .select("*")
          .single();

        if (!error && newSess) {
          setCurrentSession(newSess as ChatSession);
        } else {
          const fallbackSess: ChatSession = {
            id: "sess_" + vid,
            visitor_id: vid,
            visitor_email: user?.email,
            status: "ai_active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setCurrentSession(fallbackSess);
        }
      }
    } catch (e) {
      console.error("Failed to init chat session", e);
    }
  }, [user, getVisitorId]);

  const fetchMessages = async (sessionId: string) => {
    try {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      if (data && data.length > 0) {
        setMessages(data as ChatMessage[]);
      }
    } catch (e) {
      console.warn("Could not fetch messages", e);
    }
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
    if (!content.trim()) return;
    setLoading(true);

    const sessionId = currentSession?.id || "sess_fallback";
    const userMsg: ChatMessage = {
      id: "msg_" + Date.now(),
      session_id: sessionId,
      sender_type: "user",
      sender_name: user?.email?.split("@")[0] || "Valued Client",
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    // 1. OPTIMISTIC UPDATE: Instantly add user message to feed
    setMessages((prev) => [...prev, userMsg]);

    try {
      // 2. Persist user message to Supabase DB if session exists
      if (currentSession?.id && !currentSession.id.startsWith("sess_")) {
        await supabase.from("chat_messages").insert({
          session_id: currentSession.id,
          sender_type: "user",
          sender_name: userMsg.sender_name,
          content: userMsg.content,
        } as any);
      }

      // 3. Generate instant AI response if session status is ai_active
      if (!currentSession || currentSession.status === "ai_active") {
        setTimeout(async () => {
          let aiResponseContent = "";
          const lower = content.toLowerCase();

          if (lower.includes("withdraw") || lower.includes("payout")) {
            aiResponseContent = `Thank you for your inquiry regarding withdrawals. You can request a crypto payout anytime via Dashboard -> Withdraw (TRC20, ERC20, BTC, SOL). To ensure we process this promptly, could you confirm your account email and exact transaction details? Alexander and Pamela on our live desk have been notified to review your request.`;
          } else if (lower.includes("invest") || lower.includes("plan") || lower.includes("bundle")) {
            aiResponseContent = `Welcome to FutureFunds. To allocate capital into our active futures trading contracts, fund your Main Balance via Deposit, then click Invest under Dashboard or Plans. Would you like assistance selecting the optimal investment tier for your target ROI?`;
          } else if (lower.includes("deposit") || lower.includes("pay") || lower.includes("crypto")) {
            aiResponseContent = `To make a crypto deposit, go to Dashboard -> Deposit, choose your preferred currency (USDT, BTC, ETH) and network, and transfer to our verified corporate wallet address. Once uploaded, our treasury team approves your Main Balance immediately.`;
          } else {
            aiResponseContent = `Thank you for reaching out to FutureFunds Client Support. I have logged your message directly with Alexander and Pamela on our senior wealth desk. Let us process your request — our management team will follow up with you right here momentarily.`;
          }

          const aiMsg: ChatMessage = {
            id: "ai_" + Date.now(),
            session_id: sessionId,
            sender_type: "assistant",
            sender_name: "Futures Funds Copilot",
            content: aiResponseContent,
            created_at: new Date().toISOString(),
          };

          // Optimistically append AI response
          setMessages((prev) => [...prev, aiMsg]);

          if (currentSession?.id && !currentSession.id.startsWith("sess_")) {
            await supabase.from("chat_messages").insert({
              session_id: currentSession.id,
              sender_type: "assistant",
              sender_name: "Futures Funds Copilot",
              content: aiResponseContent,
            } as any);
          }

          setLoading(false);
        }, 1000);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error("Error in sendMessage", e);
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
