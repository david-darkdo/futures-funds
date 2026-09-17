import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Menu, X, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  const isHomePage = location.pathname === "/";

  const navLinks = [
    { name: t("nav.home"), href: "/" },
    { name: t("nav.about"), href: "#about" },
    { name: t("nav.howItWorks"), href: "#how-it-works" },
    { name: t("nav.plans"), href: "#plans" },
    { name: t("nav.security"), href: "#security" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-gold shadow-gold group-hover:shadow-gold-lg transition-all duration-300">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">
              Futures <span className="text-gold">Fund</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {isHomePage && navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm font-medium"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
            <Button variant="ghost" asChild>
              <Link to="/login">{t("nav.signIn")}</Link>
            </Button>
            <Button variant="gold" asChild>
              <Link to="/signup">{t("nav.getStarted")}</Link>
            </Button>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-foreground"
            aria-label="Menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300",
            isOpen ? "max-h-[32rem] pb-4" : "max-h-0"
          )}
        >
          <div className="flex flex-col gap-4">
            {isHomePage && navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm font-medium py-2"
              >
                {link.name}
              </a>
            ))}
            <div className="flex items-center justify-between py-2 border-t border-border">
              <span className="text-sm text-muted-foreground">{t("nav.theme", "Theme")}</span>
              <ThemeToggle />
            </div>
            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              <Button variant="ghost" asChild className="justify-start">
                <Link to="/login">{t("nav.signIn")}</Link>
              </Button>
              <Button variant="gold" asChild>
                <Link to="/signup">{t("nav.getStarted")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
