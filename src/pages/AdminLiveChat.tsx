import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { TEAM_MEMBERS, ChatSession, ChatMessage } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare, BellRing } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminLiveChat() {
  const [searchParams] = useSearchParams();
  const deepSessionId = searchParams.get("sessionId");

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("Alexander");
  const [submitting, setSubmitting] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    fetchSessions();
    if (Notification.permission === "granted") {
      setNotificationsEnabled(true);
    }
  }, []);

  const enableNotifications = async () => {
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setNotificationsEnabled(true);
        toast.success("Push notifications enabled! You will be alerted when clients text.");
      }
    }
  };

  useEffect(() => {
    if (deepSessionId && sessions.length > 0) {
      const target = sessions.find((s) => s.id === deepSessionId);
      if (target) setActiveSession(target);
    } else if (!activeSession && sessions.length > 0) {
      setActiveSession(sessions[0]);
    }
  }, [deepSessionId, sessions]);

  // Realtime listener for incoming client messages across ALL sessions
  useEffect(() => {
    const channel = supabase
      .channel("admin_all_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          if (newMsg.sender_type === "user") {
            toast.info(`💬 New message from ${newMsg.sender_name}: "${newMsg.content.substring(0, 30)}..."`);
            if (Notification.permission === "granted") {
              new Notification(`💬 New Client Message (${newMsg.sender_name})`, {
                body: newMsg.content,
                icon: "/favicon.ico",
              });
            }
            fetchSessions();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!activeSession) return;
    fetchMessages(activeSession.id);

    const channel = supabase
      .channel(`admin_chat_${activeSession.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `session_id=eq.${activeSession.id}` },
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
  }, [activeSession?.id]);

  const fetchSessions = async () => {
    const { data } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("updated_at", { ascending: false });
    setSessions((data as ChatSession[]) || []);
  };

  const fetchMessages = async (sid: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sid)
      .order("created_at", { ascending: true });
    setMessages((data as ChatMessage[]) || []);
  };

  const handleAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !replyText.trim()) return;
    setSubmitting(true);

    try {
      const { error: msgErr } = await supabase.from("chat_messages").insert({
        session_id: activeSession.id,
        sender_type: "agent",
        sender_name: selectedAgent,
        content: replyText.trim(),
      } as any);

      if (msgErr) throw msgErr;

      await supabase
        .from("chat_sessions")
        .update({
          status: "human_active",
          assigned_agent: selectedAgent,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", activeSession.id);

      toast.success(`Message sent as ${selectedAgent}. AI paused for this client.`);
      setReplyText("");
      fetchSessions();
    } catch (e: any) {
      toast.error("Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-slate-950 text-slate-100 font-sans border-t border-slate-800">
      {/* Sessions Sidebar */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            Client Chats ({sessions.length})
          </h2>
          {!notificationsEnabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={enableNotifications}
              className="text-[10px] h-7 border-amber-500/50 text-amber-400 hover:bg-amber-500/10 gap-1"
            >
              <BellRing className="w-3 h-3" />
              Enable Push
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
          {sessions.map((s) => {
            const isSelected = activeSession?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSession(s)}
                className={`w-full text-left p-3.5 transition-colors flex flex-col gap-1.5 ${
                  isSelected ? "bg-slate-800/80 border-l-2 border-amber-400" : "hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white truncate">
                    {s.visitor_email || s.visitor_name || `Client ${s.visitor_id.substring(0, 6)}`}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                      s.status === "human_active"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {s.status === "human_active" ? `Agent: ${s.assigned_agent || "Active"}` : "AI Active"}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Updated: {new Date(s.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation Detail Area */}
      {activeSession ? (
        <div className="flex-1 flex flex-col bg-slate-950">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">
                {activeSession.visitor_email || `Client (${activeSession.visitor_id})`}
              </h3>
              <p className="text-xs text-slate-400">
                Session ID: {activeSession.id} | Mode:{" "}
                <span className="text-amber-400 font-mono">{activeSession.status}</span>
              </p>
            </div>

            {/* Agent Identity Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Reply as:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {TEAM_MEMBERS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedAgent(m.name)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      selectedAgent === m.name
                        ? "bg-amber-500 text-slate-950 shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((m) => {
              const isUser = m.sender_type === "user";
              return (
                <div key={m.id} className={`flex flex-col ${isUser ? "items-start" : "items-end"} space-y-1`}>
                  <span className="text-[10px] text-slate-400 px-1">{m.sender_name}</span>
                  <div
                    className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? "bg-slate-900 border border-slate-800 text-slate-200"
                        : "bg-amber-500 text-slate-950 font-medium"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleAdminReply} className="p-4 border-t border-slate-800 bg-slate-900/90 flex gap-2">
            <Input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Type response as ${selectedAgent}... (This will pause AI)`}
              className="bg-slate-950 border-slate-800 text-xs text-slate-100"
            />
            <Button
              type="submit"
              disabled={submitting || !replyText.trim()}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium text-xs gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              Send as {selectedAgent}
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
          Select a client conversation from the sidebar to start live chatting.
        </div>
      )}
    </div>
  );
}
