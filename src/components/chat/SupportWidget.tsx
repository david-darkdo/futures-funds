import { useState, useEffect } from "react";
import { MessageSquare, X } from "lucide-react";
import { useDraggable } from "./useDraggable";
import { SupportHomeView } from "./SupportHomeView";
import { ChatConversationView } from "./ChatConversationView";
import { useLiveChat } from "@/hooks/useLiveChat";
import { useAuth } from "@/hooks/useAuth";

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"home" | "chat">("home");
  const { position, isDragging, hasMoved, bind } = useDraggable();
  const { user } = useAuth();
  const { currentSession, messages, loading, sendMessage, initSession } = useLiveChat();

  useEffect(() => {
    if (isOpen && !currentSession) {
      initSession();
    }
  }, [isOpen, currentSession, initSession]);

  const handleStartChat = () => {
    setView("chat");
    if (!currentSession) {
      initSession();
    }
  };

  const handleOpenRecentChat = () => {
    setView("chat");
  };

  const recentMsg = messages.length > 0 ? messages[messages.length - 1] : null;
  const recentTimestamp = recentMsg
    ? new Date(recentMsg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : undefined;

  return (
    <>
      {/* Draggable Floating Launcher Button */}
      <div
        style={{
          position: "fixed",
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 9999,
          touchAction: "none",
        }}
        {...bind}
      >
        <button
          onClick={() => {
            if (!hasMoved) setIsOpen(!isOpen);
          }}
          className={`relative group p-3.5 rounded-full shadow-2xl transition-transform duration-200 flex items-center justify-center ${
            isOpen
              ? "bg-slate-800 text-slate-100 ring-2 ring-slate-700"
              : "bg-slate-900 border border-slate-700/80 text-amber-400 hover:scale-105 active:scale-95 shadow-amber-500/10"
          }`}
          aria-label="Live Support"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <MessageSquare className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* Support Drawer / Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 w-[92vw] sm:w-[380px] h-[580px] max-h-[82vh] z-[9998] rounded-2xl shadow-2xl border border-slate-800 overflow-hidden bg-slate-950 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {view === "home" ? (
            <SupportHomeView
              userName={user?.email?.split("@")[0]}
              userEmail={user?.email}
              recentMessage={recentMsg?.content}
              recentTimestamp={recentTimestamp}
              onStartChat={handleStartChat}
              onOpenRecentChat={handleOpenRecentChat}
            />
          ) : (
            <ChatConversationView
              session={currentSession}
              messages={messages}
              loading={loading}
              onBack={() => setView("home")}
              onSendMessage={sendMessage}
            />
          )}
        </div>
      )}
    </>
  );
}
