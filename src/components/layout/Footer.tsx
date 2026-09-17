import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TrendingUp } from "lucide-react";

export function Footer() {
  const { t } = useTranslation();

  const company = [
    { name: t("footer.about"), href: "#about" },
    { name: t("footer.how"), href: "#how-it-works" },
    { name: t("footer.security"), href: "#security" },
  ];
  const legal = [
    { name: t("footer.privacy"), href: "/privacy" },
    { name: t("footer.terms"), href: "/terms" },
    { name: t("footer.risk"), href: "/risk-disclosure" },
  ];
  const support = [
    { name: t("footer.faq"), href: "/faq" },
    { name: t("footer.help"), href: "/help" },
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-display font-bold text-foreground">
                Futures <span className="text-gold">Fund</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">{t("footer.tagline")}</p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("footer.company")}</h4>
            <ul className="space-y-3">
              {company.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-muted-foreground hover:text-gold transition-colors text-sm">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("footer.legal")}</h4>
            <ul className="space-y-3">
              {legal.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-muted-foreground hover:text-gold transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("footer.support")}</h4>
            <ul className="space-y-3">
              {support.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-muted-foreground hover:text-gold transition-colors text-sm">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm text-center md:text-left">
            © {new Date().getFullYear()} Futures Fund. {t("footer.rights")}
          </p>
          <p className="text-muted-foreground text-xs text-center md:text-right max-w-md">
            {t("footer.disclaimer")}
          </p>
        </div>
      </div>
    </footer>
  );
}
