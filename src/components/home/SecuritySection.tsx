import { useTranslation } from "react-i18next";
import { ShieldCheck, Eye, Server, UserCheck, Lock, FileCheck } from "lucide-react";

const FEATURES = [
  { icon: ShieldCheck, key: "encryption" },
  { icon: Eye, key: "manual" },
  { icon: Server, key: "infra" },
  { icon: UserCheck, key: "kyc" },
  { icon: Lock, key: "noAuto" },
  { icon: FileCheck, key: "audit" },
] as const;

export function SecuritySection() {
  const { t } = useTranslation();
  return (
    <section id="security" className="py-20 md:py-32 relative bg-card/50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <span className="text-gold text-sm font-semibold tracking-wider uppercase mb-4 block">
                {t("home.security.tag")}
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
                {t("home.security.titleLead")} <span className="text-gradient-gold">{t("home.security.titleAccent")}</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8">{t("home.security.subtitle")}</p>

              <div className="flex flex-wrap gap-4">
                <div className="px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium">
                  {t("home.security.badge1")}
                </div>
                <div className="px-4 py-2 rounded-full bg-teal/10 border border-teal/20 text-teal text-sm font-medium">
                  {t("home.security.badge2")}
                </div>
                <div className="px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium">
                  {t("home.security.badge3")}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURES.map((f) => (
                <div
                  key={f.key}
                  className="p-5 rounded-xl bg-background border border-border hover:border-gold/30 transition-all duration-300 hover:shadow-gold group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center mb-3 group-hover:bg-gold/20 transition-colors">
                    <f.icon className="w-5 h-5 text-gold" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1 text-sm">
                    {t(`home.security.items.${f.key}.title`)}
                  </h4>
                  <p className="text-muted-foreground text-xs">
                    {t(`home.security.items.${f.key}.desc`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
