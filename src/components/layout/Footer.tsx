import { Link } from "react-router-dom";
import { TrendingUp, Mail, MessageCircle, Phone } from "lucide-react";

const footerLinks = {
  company: [
    { name: "About Us", href: "#about" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Security", href: "#security" },
    { name: "Contact", href: "#contact" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Risk Disclosure", href: "/risk-disclosure" },
  ],
  support: [
    { name: "FAQ", href: "/faq" },
    { name: "Help Center", href: "/help" },
    { name: "Telegram Support", href: "https://t.me/futurefunds" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-display font-bold text-foreground">
                Future<span className="text-gold">Funds</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              Smart crypto investment platform with transparent growth and secure future opportunities.
            </p>
            <div className="flex gap-4">
              <a
                href="https://t.me/futurefunds"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-secondary hover:bg-gold/20 transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-muted-foreground hover:text-gold" />
              </a>
              <a
                href="mailto:support@futurefunds.com"
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-secondary hover:bg-gold/20 transition-colors"
              >
                <Mail className="w-5 h-5 text-muted-foreground hover:text-gold" />
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-gold transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-gold transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-gold transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm text-center md:text-left">
            © {new Date().getFullYear()} FutureFunds. All rights reserved.
          </p>
          <p className="text-muted-foreground text-xs text-center md:text-right max-w-md">
            Investment involves risk. Past performance is not indicative of future results. 
            Please invest responsibly.
          </p>
        </div>
      </div>
    </footer>
  );
}
