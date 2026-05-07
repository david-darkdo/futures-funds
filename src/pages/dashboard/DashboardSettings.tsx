import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Moon, Sun, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ThemeProvider";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { toast } from "sonner";

interface ProfileData {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  language: string | null;
  theme: string | null;
}

export default function DashboardSettings() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    email: "",
    avatar_url: null,
    language: i18n.language,
    theme,
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url, language, theme")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setProfile({
          full_name: data.full_name ?? "",
          email: data.email ?? user.email ?? "",
          avatar_url: data.avatar_url,
          language: data.language ?? i18n.language,
          theme: data.theme ?? theme,
        });
        if (data.language && data.language !== i18n.language) {
          i18n.changeLanguage(data.language);
        }
        if (data.theme && (data.theme === "light" || data.theme === "dark") && data.theme !== theme) {
          setTheme(data.theme as "light" | "dark");
        }
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be < 5MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600", upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setProfile((p) => ({ ...p, avatar_url: data.publicUrl }));
      toast.success("Photo uploaded");
    } catch (err) {
      console.error(err);
      toast.error(t("settings.uploadFailed"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removePhoto = () => setProfile((p) => ({ ...p, avatar_url: null }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        language: profile.language,
        theme: profile.theme,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(t("settings.saveFailed"));
      return;
    }
    if (profile.language) i18n.changeLanguage(profile.language);
    if (profile.theme === "light" || profile.theme === "dark") setTheme(profile.theme);
    toast.success(t("settings.saved"));
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t("settings.title")}</h2>
        <p className="text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profilePicture")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center overflow-hidden border border-border">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-semibold text-gold">
                  {(profile.full_name || user?.email || "U").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFile}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="gap-2"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {t("settings.uploadPhoto")}
              </Button>
              {profile.avatar_url && (
                <Button variant="ghost" size="sm" onClick={removePhoto} className="gap-2 text-destructive">
                  <X className="w-4 h-4" /> {t("settings.removePhoto")}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">{t("settings.fullName")}</Label>
            <Input
              id="full_name"
              value={profile.full_name ?? ""}
              onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("settings.email")}</Label>
            <Input id="email" value={profile.email ?? ""} disabled />
            <p className="text-xs text-muted-foreground">{t("settings.emailLocked")}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.appearance")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setProfile((p) => ({ ...p, theme: "dark" }))}
              className={`p-4 rounded-lg border flex items-center gap-3 transition ${
                profile.theme === "dark" ? "border-gold bg-gold/10" : "border-border hover:border-gold/40"
              }`}
            >
              <Moon className="w-5 h-5" />
              <span>{t("settings.darkMode")}</span>
            </button>
            <button
              type="button"
              onClick={() => setProfile((p) => ({ ...p, theme: "light" }))}
              className={`p-4 rounded-lg border flex items-center gap-3 transition ${
                profile.theme === "light" ? "border-gold bg-gold/10" : "border-border hover:border-gold/40"
              }`}
            >
              <Sun className="w-5 h-5" />
              <span>{t("settings.lightMode")}</span>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.language")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={profile.language ?? "en"}
            onValueChange={(v) => setProfile((p) => ({ ...p, language: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="gold" onClick={handleSave} disabled={saving} className="gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? t("settings.saving") : t("settings.save")}
        </Button>
      </div>
    </div>
  );
}
