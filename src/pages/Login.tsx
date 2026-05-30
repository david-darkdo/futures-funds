import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Eye, EyeOff, ArrowRight, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default function Login() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log("[Login] Attempting sign in for:", email);
    const { error } = await signIn(email, password);

    setIsLoading(false);

    if (error) {
      console.error("[Login] Sign in failed:", error.message);
      toast({
        title: t("auth.signInFailed"),
        description: error.message === "Invalid login credentials"
          ? t("auth.invalidCreds")
          : error.message,
        variant: "destructive",
      });
    } else {
      console.log("[Login] Login successful — triggering login-alert function");

      // Fire login alert (fire and forget, but log result)
      try {
        const device = navigator.userAgent.includes("Mobile") ? "Mobile Device" : "Desktop Browser";
        console.log("[Login] Calling login-alert with device:", device);

        supabase.functions.invoke("login-alert", {
          body: {
            device,
            ip: "Detected by server",
          },
        }).then(({ data, error: fnError }) => {
          if (fnError) {
            console.error("[Login] login-alert function error:", fnError.message);
          } else {
            console.log("[Login] login-alert response:", JSON.stringify(data));
          }
        }).catch((e) => {
          console.error("[Login] login-alert invocation exception:", e);
        });
      } catch (e) {
        console.error("[Login] Failed to invoke login-alert:", e);
      }
    }
  };


  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">
              Future<span className="text-gold">Funds</span>
            </span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold mb-2">{t("auth.welcomeBack")}</h1>
            <p className="text-muted-foreground">{t("auth.signInSubtitle")}</p>
          </div>

          {/* Form */}
          <div className="space-y-4 mb-6">
            <GoogleSignInButton />
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">{t("auth.orContinueWith")}</span>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-secondary border-border"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Link to="/forgot-password" className="text-sm text-gold hover:text-gold-light transition-colors">
                  {t("auth.forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-secondary border-border"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="gold" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {t("auth.signingIn")}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {t("auth.signIn")}
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <Link to="/signup" className="text-gold hover:text-gold-light font-medium transition-colors">
              {t("auth.signUp")}
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex flex-1 relative bg-card overflow-hidden">
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-teal/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center justify-center p-12">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-8 flex items-center justify-center rounded-2xl bg-gradient-gold shadow-gold-lg animate-float">
              <TrendingUp className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-display font-bold mb-4">
              {t("auth.brandTitleLogin")}
              <br />
              <span className="text-gradient-gold">{t("auth.brandTitleLoginAccent")}</span>
            </h2>
            <p className="text-muted-foreground">{t("auth.brandSubtitleLogin")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
