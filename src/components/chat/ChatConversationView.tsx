import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Sparkles, ImagePlus, X, Loader2 } from "lucide-react";
import { uploadChatImages, downloadImage } from "@/lib/chatUpload";
import { toast } from "sonner";
import { TEAM_MEMBERS, ChatMessage, ChatSession } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  session: ChatSession | null;
  messages: ChatMessage[];
  loading: boolean;
  onBack: () => void;
  onSendMessage: (text: string, attachments?: string[]) => void;
}

export function ChatConversationView({ session, messages, loading, onBack, onSendMessage }: Props) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && pending.length === 0) return;

    let urls: string[] = [];
    if (pending.length) {
      setUploading(true);
      try {
        urls = await uploadChatImages(pending, session?.id || "guest");
      } catch {
        toast.error("Could not upload image. Please try again.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSendMessage(text.trim(), urls);
    setText("");
    setPending([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const assignedMember = TEAM_MEMBERS.find((m) => m.name.toLowerCase() === session?.assigned_agent?.toLowerCase());

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-10">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          {assignedMember ? (
            <div className="relative">
              <img
                src={assignedMember.avatarUrl}
                alt={assignedMember.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-amber-400"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-slate-900" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold text-white leading-tight">
              {assignedMember ? assignedMember.name : "Futures Funds Copilot"}
            </h3>
            <p className="text-[10px] text-slate-400">
              {assignedMember ? assignedMember.role : "Instant Advisory & Client Support"}
            </p>
          </div>
        </div>

        <div className="w-5" />
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-300">Welcome to Futures Funds Support</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Ask any question about deposits, plans, withdrawals, or portfolio management.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender_type === "user";
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}
              >
                {!isUser && (
                  <span className="text-[10px] text-slate-400 font-medium px-1">
                    {msg.sender_name || "Advisory Desk"}
                  </span>
                )}
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? "bg-amber-500 text-slate-950 font-medium rounded-br-xs"
                      : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-xs shadow-sm"
                  }`}
                >
                  {msg.content}
                  {!!msg.attachments?.length && (
                    <div className={`grid gap-1.5 ${msg.content ? "mt-2" : ""} ${msg.attachments.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                      {msg.attachments.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt="Shared attachment"
                          loading="lazy"
                          onClick={() => downloadImage(url, `futures-funds-${i + 1}.jpg`)}
                          className="rounded-lg max-h-44 w-full object-cover cursor-pointer"
                        />
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            );
          })
        )}

        {loading && (
          <div className="flex flex-col items-start space-y-1">
            <span className="text-[10px] text-slate-400 font-medium px-1">
              {assignedMember ? assignedMember.name : "Futures Funds Support"}
            </span>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-xs px-4 py-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 animate-bounce" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Composer */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-900/90 backdrop-blur space-y-2">
        {pending.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {pending.map((f, i) => (
              <div key={i} className="relative">
                <img src={URL.createObjectURL(f)} alt={f.name} className="w-14 h-14 rounded-lg object-cover border border-slate-700" />
                <button
                  type="button"
                  onClick={() => setPending((p) => p.filter((_, idx) => idx !== i))}
                  className="absolute -top-1.5 -right-1.5 bg-slate-800 border border-slate-600 rounded-full p-0.5 text-slate-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length) setPending((p) => [...p, ...files].slice(0, 6));
          }}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => fileRef.current?.click()}
          className="shrink-0 h-9 w-9 text-amber-400 hover:text-amber-300 hover:bg-slate-800"
          aria-label="Attach images"
        >
          <ImagePlus className="w-5 h-5" />
        </Button>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message..."
          className="bg-slate-950 border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50"
        />
        <Button
          type="submit"
          size="icon"
          disabled={(!text.trim() && pending.length === 0) || loading || uploading}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 shrink-0 h-9 w-9"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
        </div>
      </form>
    </div>
  );
}
