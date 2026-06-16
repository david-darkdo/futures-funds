import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, TrendingUp, Zap } from "lucide-react";

export function HeroSection() {
  const { t } = useTranslation();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 bg-hero-glow" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--gold)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--gold)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
            <span className="text-sm text-muted-foreground">{t("home.hero.badge")}</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {t("home.hero.titleLine1")}
            <br />
            <span className="text-gradient-gold">{t("home.hero.titleLine2")}</span>
            <br />
            {t("home.hero.titleLine3")}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {t("home.hero.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button variant="gold" size="xl" asChild className="group">
              <Link to="/signup">
                {t("home.hero.getStarted")}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="glass" size="xl" asChild>
              <a href="#plans">{t("home.hero.viewPlans")}</a>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="bg-glass p-6 rounded-2xl border border-border/50">
              <div className="flex items-center justify-center gap-2 text-gold mb-2">
                <Shield className="w-5 h-5" />
                <span className="text-2xl font-bold">100%</span>
              </div>
              <p className="text-sm text-muted-foreground">{t("home.hero.stat1")}</p>
            </div>
            <div className="bg-glass p-6 rounded-2xl border border-border/50">
              <div className="flex items-center justify-center gap-2 text-teal mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-2xl font-bold">5,000+</span>
              </div>
              <p className="text-sm text-muted-foreground">{t("home.hero.stat2")}</p>
            </div>
            <div className="bg-glass p-6 rounded-2xl border border-border/50">
              <div className="flex items-center justify-center gap-2 text-gold mb-2">
                <Zap className="w-5 h-5" />
                <span className="text-2xl font-bold">24/7</span>
              </div>
              <p className="text-sm text-muted-foreground">{t("home.hero.stat3")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
