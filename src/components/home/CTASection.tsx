import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  const { t } = useTranslation();
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-8 md:p-12 rounded-3xl bg-glass border border-border/50 shadow-gold-lg">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
              {t("home.cta.titleLead")}
              <br />
              <span className="text-gradient-gold">{t("home.cta.titleAccent")}</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">{t("home.cta.subtitle")}</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="gold" size="xl" asChild className="group">
                <Link to="/signup">
                  {t("home.cta.primary")}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <a href="#plans">{t("home.cta.secondary")}</a>
              </Button>
            </div>

            <p className="mt-8 text-muted-foreground text-sm">🔒 {t("home.cta.trust")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
