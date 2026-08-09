import { useState } from "react";
import { TrendingUp, MessageSquare, Clock, ChevronRight, Send, HelpCircle, CheckCircle2 } from "lucide-react";
import { TEAM_MEMBERS } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  userName?: string;
  userEmail?: string;
  recentMessage?: string;
  recentTimestamp?: string;
  onStartChat: () => void;
  onOpenRecentChat: () => void;
}

export function SupportHomeView({
  userName,
  userEmail,
  recentMessage,
  recentTimestamp,
  onStartChat,
  onOpenRecentChat,
}: Props) {
  const [feedback, setFeedback] = useState("");
  const [senderName, setSenderName] = useState(userName || "");
  const [senderEmail, setSenderEmail] = useState(userEmail || "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("client_feedback").insert({
        visitor_name: senderName || "Valued Client",
        visitor_email: senderEmail || null,
        message: feedback.trim(),
      } as any);
      if (error) throw error;
      setSubmitted(true);
      toast.success("Thank you! Your feedback has been sent to management.");
      setFeedback("");
    } catch (err: any) {
      toast.error("Could not send feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-slate-950 text-slate-100 font-sans">
      {/* Header with Logo & 3 Avatars */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <span className="font-bold text-base tracking-tight text-white">
            Future<span className="text-amber-400">Funds</span>
          </span>
        </div>

        {/* 3 Team Avatars Stack */}
        <div className="flex items-center -space-x-2 overflow-hidden">
          {TEAM_MEMBERS.map((member) => (
            <div key={member.id} className="relative group">
              <img
                src={member.avatarUrl}
                alt={member.name}
                className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900 object-cover"
              />
              <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-slate-900" />
            </div>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <div className="p-5 bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-950 border-b border-slate-800/80">
        <h2 className="text-xl font-semibold text-white tracking-tight">
          Hello {userName ? <span className="text-amber-400">{userName}</span> : "there"},
        </h2>
        <p className="text-slate-400 text-sm mt-1">How can our wealth desk help you today?</p>
      </div>

      <div className="p-5 space-y-6 flex-1">
        {/* Main Action Card 1: Send us a message */}
        <button
          onClick={onStartChat}
          className="w-full text-left p-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 transition-all duration-200 shadow-lg group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                  Send us a message
                </h3>
                <p className="text-xs text-slate-400">Our AI & advisors reply instantly 24/7</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </div>
        </button>

        {/* Main Action Card 2: Recent message */}
        {recentMessage && (
          <button
            onClick={onOpenRecentChat}
            className="w-full text-left p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                Recent Message
              </div>
              {recentTimestamp && <span className="text-[11px] text-slate-500">{recentTimestamp}</span>}
            </div>
            <p className="text-sm text-slate-300 line-clamp-2 italic">"{recentMessage}"</p>
          </button>
        )}

        {/* Crypto FAQs Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            Frequent Asked Questions
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="faq-withdraw" className="border border-slate-800 bg-slate-900/50 rounded-xl px-4">
              <AccordionTrigger className="text-sm font-medium text-slate-200 hover:text-amber-400 py-3">
                How to withdraw with crypto
              </AccordionTrigger>
              <AccordionContent className="text-xs text-slate-400 space-y-2 pb-4 leading-relaxed">
                <p>To withdraw your liquid funds (Main + Profit Balance):</p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                  <li>Navigate to <strong>Dashboard → Withdraw</strong>.</li>
                  <li>Enter the USD amount you wish to withdraw.</li>
                  <li>Select your currency (USDT, USDC, BTC, ETH) and Network (TRC20, ERC20, BSC, Polygon, Solana, Bitcoin).</li>
                  <li>Paste your destination wallet address carefully.</li>
                  <li>Click <strong>Submit Request</strong>. Our treasury desk verifies and releases funds within minutes.</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-invest" className="border border-slate-800 bg-slate-900/50 rounded-xl px-4">
              <AccordionTrigger className="text-sm font-medium text-slate-200 hover:text-amber-400 py-3">
                How to invest
              </AccordionTrigger>
              <AccordionContent className="text-xs text-slate-400 space-y-2 pb-4 leading-relaxed">
                <p>To deploy capital into active yield contracts:</p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                  <li>Ensure your <strong>Main Balance</strong> is funded.</li>
                  <li>Go to <strong>Dashboard → Invest</strong> or explore <strong>Plans</strong>.</li>
                  <li>Choose your preferred investment tier and enter the allocation amount.</li>
                  <li>Click <strong>Confirm Investment</strong>. Your capital begins accruing real-time daily profit immediately.</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-payment" className="border border-slate-800 bg-slate-900/50 rounded-xl px-4">
              <AccordionTrigger className="text-sm font-medium text-slate-200 hover:text-amber-400 py-3">
                How to make payment with crypto
              </AccordionTrigger>
              <AccordionContent className="text-xs text-slate-400 space-y-2 pb-4 leading-relaxed">
                <p>To fund your account via cryptocurrency:</p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                  <li>Go to <strong>Dashboard → Deposit</strong>.</li>
                  <li>Enter the USD amount and choose your crypto method (e.g. USDT TRC20, BTC).</li>
                  <li>Copy the corporate wallet address and transfer the exact crypto amount.</li>
                  <li>Upload your transfer receipt screenshot and enter your transaction TXID.</li>
                  <li>Click <strong>Submit</strong>. Once confirmed on-chain, your Main Balance updates automatically.</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Feedback Section */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-white">Leave us a feedback or suggestion</h4>
            {submitted ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Thank you! Your suggestion has been logged with management.</span>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                {!userName && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Your Name (Optional)"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-xs text-slate-200 placeholder:text-slate-600"
                    />
                    <Input
                      placeholder="Your Email (Optional)"
                      type="email"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-xs text-slate-200 placeholder:text-slate-600"
                    />
                  </div>
                )}
                <Textarea
                  placeholder="Share your thoughts, suggestions, or features you would like us to add..."
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:border-amber-500/50"
                />
                <Button
                  type="submit"
                  disabled={submitting || !feedback.trim()}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium text-xs h-9 gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? "Sending..." : "Submit Feedback"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
