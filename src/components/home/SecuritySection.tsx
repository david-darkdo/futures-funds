import { ShieldCheck, Eye, Server, UserCheck, Lock, FileCheck } from "lucide-react";

const securityFeatures = [
  {
    icon: ShieldCheck,
    title: "End-to-End Encryption",
    description: "All data is encrypted using industry-standard protocols.",
  },
  {
    icon: Eye,
    title: "Manual Verification",
    description: "Every transaction is personally reviewed by our team.",
  },
  {
    icon: Server,
    title: "Secure Infrastructure",
    description: "Enterprise-grade servers with 99.9% uptime guarantee.",
  },
  {
    icon: UserCheck,
    title: "KYC Compliance",
    description: "Identity verification for enhanced account security.",
  },
  {
    icon: Lock,
    title: "No Auto Wallets",
    description: "Manual wallet management prevents automated exploits.",
  },
  {
    icon: FileCheck,
    title: "Full Audit Trail",
    description: "Complete transparency with detailed activity logs.",
  },
];

export function SecuritySection() {
  return (
    <section id="security" className="py-20 md:py-32 relative bg-card/50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div>
              <span className="text-gold text-sm font-semibold tracking-wider uppercase mb-4 block">
                Security First
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
                Your Security is Our <span className="text-gradient-gold">Priority</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                We've built FutureFunds with security at its core. From encrypted 
                communications to manual verification processes, every layer is 
                designed to protect your investments.
              </p>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-4">
                <div className="px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium">
                  256-bit Encryption
                </div>
                <div className="px-4 py-2 rounded-full bg-teal/10 border border-teal/20 text-teal text-sm font-medium">
                  SOC 2 Compliant
                </div>
                <div className="px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium">
                  GDPR Ready
                </div>
              </div>
            </div>

            {/* Right Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {securityFeatures.map((feature, index) => (
                <div
                  key={feature.title}
                  className="p-5 rounded-xl bg-background border border-border hover:border-gold/30 transition-all duration-300 hover:shadow-gold group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center mb-3 group-hover:bg-gold/20 transition-colors">
                    <feature.icon className="w-5 h-5 text-gold" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1 text-sm">
                    {feature.title}
                  </h4>
                  <p className="text-muted-foreground text-xs">
                    {feature.description}
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
