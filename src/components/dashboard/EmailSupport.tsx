import { Mail } from "lucide-react";

const SUPPORT_EMAIL = "futurefundsrg@gmail.com";

/**
 * Floating envelope button — opens the user's mail client pre-addressed
 * to the Future Funds support inbox. Sits below the WhatsApp bubble.
 */
export function EmailSupport() {
  return (
    <a
      href={`mailto:${SUPPORT_EMAIL}?subject=Future%20Funds%20Support`}
      aria-label="Email support"
      className="fixed right-4 z-40 w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-gold to-[#a8893b] text-primary-foreground shadow-lg hover:scale-110 transition-transform"
      style={{ bottom: "calc(10.5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <Mail className="w-5 h-5" />
    </a>
  );
}
