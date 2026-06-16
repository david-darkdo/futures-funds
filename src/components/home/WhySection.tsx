import { useTranslation } from "react-i18next";
import { Shield, Eye, TrendingUp, Lock } from "lucide-react";

const FEATURES = [
  { icon: Shield, key: "security", color: "gold" },
  { icon: Eye, key: "verification", color: "teal" },
  { icon: TrendingUp, key: "curated", color: "gold" },
  { icon: Lock, key: "risk", color: "teal" },
] as const;

export function WhySection() {
  const { t } = useTranslation();
  return (
    <section id="about" className="py-20 md:py-32 relative">
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-gold/5 rounded-full blur-3xl -translate-y-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-gold text-sm font-semibold tracking-wider uppercase mb-4 block">
            {t("home.why.tag")}
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
            {t("home.why.titleLead")} <span className="text-gradient-gold">{t("home.why.titleAccent")}</span>?
          </h2>
          <p className="text-muted-foreground text-lg">{t("home.why.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {FEATURES.map((f) => (
            <div
              key={f.key}
              className="group p-8 rounded-2xl bg-card border border-border hover:border-gold/30 transition-all duration-500 hover:shadow-gold"
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${
                f.color === 'gold' ? 'bg-gold/10 text-gold' : 'bg-teal/10 text-teal'
              } group-hover:scale-110 transition-transform duration-300`}>
                <f.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-gold transition-colors">
                {t(`home.why.items.${f.key}.title`)}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t(`home.why.items.${f.key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
