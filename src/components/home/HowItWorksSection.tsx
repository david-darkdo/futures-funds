import { useTranslation } from "react-i18next";
import { UserPlus, Package, Wallet, Upload, CheckCircle, Rocket } from "lucide-react";

const STEPS = [
  { icon: UserPlus, key: "account" },
  { icon: Package, key: "bundle" },
  { icon: Wallet, key: "pay" },
  { icon: Upload, key: "proof" },
  { icon: CheckCircle, key: "verify" },
  { icon: Rocket, key: "grow" },
] as const;

export function HowItWorksSection() {
  const { t } = useTranslation();
  return (
    <section id="how-it-works" className="py-20 md:py-32 relative bg-card/50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-gold text-sm font-semibold tracking-wider uppercase mb-4 block">
            {t("home.how.tag")}
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
            {t("home.how.titleLead")} <span className="text-gradient-gold">{t("home.how.titleAccent")}</span>
          </h2>
          <p className="text-muted-foreground text-lg">{t("home.how.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {STEPS.map((step, index) => (
            <div key={step.key} className="relative group">
              {index < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-full h-px bg-gradient-to-r from-border to-transparent" />
              )}
              <div className="p-6 rounded-2xl bg-background border border-border group-hover:border-gold/30 transition-all duration-500 hover:shadow-gold relative z-10">
                <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center text-sm font-bold text-primary-foreground shadow-gold">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                  <step.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  {t(`home.how.steps.${step.key}.title`)}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t(`home.how.steps.${step.key}.desc`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
