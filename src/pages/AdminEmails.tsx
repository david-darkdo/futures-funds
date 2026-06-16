import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Sparkles, Send, Loader2, Image as ImageIcon } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAdminData } from "@/hooks/useAdminData";
import { toast } from "sonner";

export default function AdminEmails() {
  const { t } = useTranslation();
  const { stats } = useAdminData();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [recipient, setRecipient] = useState("");
  const [prompt, setPrompt] = useState("");
  const [includeImage, setIncludeImage] = useState(true);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error(t("adminEmail.prompt"));
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-compose-email", {
        body: { prompt, includeImage },
      });
      if (error) throw error;
      setSubject(data.subject || "");
      setBodyHtml(data.bodyHtml || "");
      setImageDataUrl(data.imageDataUrl || null);
      toast.success(t("adminEmail.preview"));
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || t("adminEmail.generateFailed"));
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!recipient.trim() || !subject.trim() || !bodyHtml.trim()) {
      toast.error(t("adminEmail.failed"));
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-email", {
        body: {
          type: "custom",
          to: recipient.trim(),
          fullName: "Valued Investor",
          userId: "admin-broadcast",
          subject,
          bodyHtml,
          imageDataUrl,
        },
      });
      if (error) throw error;
      toast.success(t("adminEmail.sent"));
      setSubject("");
      setBodyHtml("");
      setImageDataUrl(null);
      setPrompt("");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || t("adminEmail.failed"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingPayments={stats.pendingPayments}
        pendingWithdrawals={stats.pendingWithdrawals}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center">
              <Mail className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t("adminEmail.title")}</h1>
              <p className="text-xs text-muted-foreground">{t("adminEmail.subtitle")}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-7xl w-full mx-auto">
          {/* Compose */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-gold" /> Compose</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">{t("adminEmail.recipient")}</Label>
                <Input
                  id="recipient"
                  type="email"
                  placeholder={t("adminEmail.recipientPh")}
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">{t("adminEmail.prompt")}</Label>
                <Textarea
                  id="prompt"
                  placeholder={t("adminEmail.promptPh")}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/40">
                <Label htmlFor="includeImage" className="flex items-center gap-2 cursor-pointer">
                  <ImageIcon className="w-4 h-4 text-gold" />
                  {t("adminEmail.includeImage")}
                </Label>
                <Switch id="includeImage" checked={includeImage} onCheckedChange={setIncludeImage} />
              </div>

              <Button variant="gold-outline" onClick={handleGenerate} disabled={generating} className="w-full gap-2">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? t("adminEmail.generating") : t("adminEmail.generate")}
              </Button>

              <div className="space-y-2">
                <Label htmlFor="subject">{t("adminEmail.subject")}</Label>
                <Input
                  id="subject"
                  placeholder={t("adminEmail.subjectPh")}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">{t("adminEmail.body")}</Label>
                <Textarea
                  id="body"
                  placeholder={t("adminEmail.bodyPh")}
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  className="min-h-[260px] font-mono text-xs"
                />
              </div>

              {imageDataUrl && (
                <div className="p-2 rounded-lg border border-gold/30 bg-gold/5">
                  <p className="text-xs text-gold mb-2">{t("adminEmail.imageGenerated")}</p>
                  <img src={imageDataUrl} alt="Generated" className="w-full rounded-md" />
                </div>
              )}

              <Button variant="gold" onClick={handleSend} disabled={sending || !subject || !bodyHtml || !recipient} className="w-full gap-2">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? t("adminEmail.sending") : t("adminEmail.send")}
              </Button>
            </CardContent>
          </Card>

          {/* Live preview */}
          <Card>
            <CardHeader>
              <CardTitle>{t("adminEmail.preview")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden border border-border bg-[#0a1628] p-6">
                {imageDataUrl && (
                  <img src={imageDataUrl} alt="" className="w-full rounded-md mb-4" />
                )}
                <h2 className="text-gold text-lg font-bold mb-3">{subject || "Subject will appear here"}</h2>
                <div
                  className="text-[#c5d0dc] text-sm leading-relaxed prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: bodyHtml || "<p style='opacity:0.5'>Generated body will appear here.</p>",
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
