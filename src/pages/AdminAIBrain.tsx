import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminAIBrain() {
  const [systemPrompt, setSystemPrompt] = useState("");
  const [faqsJson, setFaqsJson] = useState("");
  const [escalationKeywords, setEscalationKeywords] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from("ai_settings").select("*").limit(1).maybeSingle();
    if (data) {
      setSystemPrompt(data.system_prompt || "");
      setFaqsJson(data.faqs_json || "");
      setEscalationKeywords(data.escalation_keywords || "");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase.from("ai_settings").select("id").limit(1).maybeSingle();
      if (existing) {
        await supabase
          .from("ai_settings")
          .update({
            system_prompt: systemPrompt,
            faqs_json: faqsJson,
            escalation_keywords: escalationKeywords,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", existing.id);
      } else {
        await supabase.from("ai_settings").insert({
          system_prompt: systemPrompt,
          faqs_json: faqsJson,
          escalation_keywords: escalationKeywords,
        } as any);
      }
      toast.success("AI Brain settings updated successfully!");
    } catch (e: any) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-slate-100 font-sans">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            AI Brain & Prompt Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure the AI Copilot persona, prompt rules, FAQs, and human handoff triggers live.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save AI Brain Rules"}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-amber-400">System Instruction / AI Persona Prompt</Label>
          <Textarea
            rows={10}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="bg-slate-950 border-slate-800 text-xs font-mono text-slate-200"
            placeholder="Enter the AI system prompt..."
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-amber-400">Escalation Keywords (Comma separated)</Label>
          <Input
            value={escalationKeywords}
            onChange={(e) => setEscalationKeywords(e.target.value)}
            className="bg-slate-950 border-slate-800 text-xs text-slate-200"
            placeholder="human, admin, urgent, stuck, deposit failed, talk to agent"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-amber-400">Company FAQs Knowledge Base (JSON Format)</Label>
          <Textarea
            rows={6}
            value={faqsJson}
            onChange={(e) => setFaqsJson(e.target.value)}
            className="bg-slate-950 border-slate-800 text-xs font-mono text-slate-200"
            placeholder="JSON array of FAQs..."
          />
        </div>
      </div>
    </div>
  );
}
