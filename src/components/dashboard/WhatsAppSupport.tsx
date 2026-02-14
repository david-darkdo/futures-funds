import { useState, useRef, useCallback, useEffect } from "react";
import { X, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const WHATSAPP_LINK = "https://wa.me/qr/6FQ7QETQTMCBF1";

export function WhatsAppSupport() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string | null; email: string | null } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const didDrag = useRef(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  }, [user]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    didDrag.current = false;
    setDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: position.x,
      origY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current || !dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDrag.current = true;
    setPosition({
      x: dragRef.current.origX + dx,
      y: dragRef.current.origY + dy,
    });
  }, [dragging]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
    dragRef.current = null;
  }, []);

  const handleClick = () => {
    if (!didDrag.current) setOpen((prev) => !prev);
  };

  const handleSend = () => {
    if (!message.trim()) return;
    const userName = profile?.full_name || "N/A";
    const userEmail = profile?.email || user?.email || "N/A";
    const userId = user?.id || "N/A";

    const fullMessage = `User: ${userName}\nEmail: ${userEmail}\nID: ${userId}\n\nMessage: ${message.trim()}`;
    const encoded = encodeURIComponent(fullMessage);
    window.open(`${WHATSAPP_LINK}?text=${encoded}`, "_blank");
    setMessage("");
    setOpen(false);
  };

  return (
    <>
      {/* Chat Popup */}
      <div
        className={cn(
          "fixed z-[9999] bottom-24 right-6 w-80 rounded-2xl bg-background border border-border shadow-2xl transition-all duration-300 origin-bottom-right",
          open ? "scale-100 opacity-100 pointer-events-auto" : "scale-90 opacity-0 pointer-events-none"
        )}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) ${open ? "scale(1)" : "scale(0.9)"}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 rounded-t-2xl" style={{ backgroundColor: "#25D366" }}>
          <div className="flex items-center gap-2">
            <WhatsAppIcon className="w-5 h-5 text-white" />
            <span className="font-semibold text-white text-sm">Support Zone</span>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Type your message below. You'll be redirected to WhatsApp to continue the conversation.
          </p>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="How can we help you?"
            className="min-h-[80px] resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim()}
            className="w-full text-white font-medium rounded-xl"
            style={{ backgroundColor: "#25D366" }}
          >
            <Send className="w-4 h-4 mr-2" />
            Send via WhatsApp
          </Button>
        </div>
      </div>

      {/* Floating Button */}
      <div
        ref={buttonRef}
        className={cn(
          "fixed z-[9999] bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center cursor-grab shadow-lg transition-transform duration-200 hover:scale-110 active:cursor-grabbing select-none",
          dragging && "scale-105"
        )}
        style={{
          backgroundColor: "#25D366",
          transform: `translate(${position.x}px, ${position.y}px)`,
          touchAction: "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
      >
        <WhatsAppIcon className="w-7 h-7 text-white" />
      </div>
    </>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
