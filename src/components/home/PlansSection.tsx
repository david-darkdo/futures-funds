import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Crown, Building2 } from "lucide-react";

const plans = [
  {
    name: "Starter",
    icon: Sparkles,
    price: "$500",
    description: "Perfect for beginners exploring crypto investment.",
    features: [
      "Entry-level investment",
      "Basic portfolio access",
      "Email support",
      "Monthly reports",
      "Secure dashboard",
    ],
    popular: false,
    accent: "teal",
  },
  {
    name: "Professional",
    icon: Crown,
    price: "$2,500",
    description: "For serious investors seeking enhanced opportunities.",
    features: [
      "Premium portfolio access",
      "Priority verification",
      "24/7 support access",
      "Weekly reports",
      "Advanced analytics",
      "Dedicated manager",
    ],
    popular: true,
    accent: "gold",
  },
  {
    name: "Institutional",
    icon: Building2,
    price: "$10,000+",
    description: "Enterprise-grade solutions for high-volume investors.",
    features: [
      "Full portfolio access",
      "VIP verification",
      "Personal account manager",
      "Daily reports",
      "Custom strategies",
      "Priority withdrawals",
      "Exclusive opportunities",
    ],
    popular: false,
    accent: "teal",
  },
];

export function PlansSection() {
  return (
    <section id="plans" className="py-20 md:py-32 relative">
      {/* Background Effects */}
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl -translate-y-1/2" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-gold text-sm font-semibold tracking-wider uppercase mb-4 block">
            Investment Plans
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
            Choose Your <span className="text-gradient-gold">Bundle</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Select the investment bundle that aligns with your financial goals. 
            All plans include full transparency and manual verification.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all duration-500 ${
                plan.popular 
                  ? 'bg-gradient-to-b from-gold/10 to-background border-2 border-gold shadow-gold-lg scale-[1.02]' 
                  : 'bg-card border border-border hover:border-gold/30 hover:shadow-gold'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-gold text-primary-foreground text-sm font-semibold shadow-gold">
                  Most Popular
                </div>
              )}

              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${
                plan.accent === 'gold' 
                  ? 'bg-gold/20 text-gold' 
                  : 'bg-teal/20 text-teal'
              }`}>
                <plan.icon className="w-7 h-7" />
              </div>

              {/* Plan Name & Price */}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-gradient-gold">{plan.price}</span>
                {plan.name !== "Institutional" && <span className="text-muted-foreground">USD</span>}
              </div>
              <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <Check className={`w-5 h-5 flex-shrink-0 ${
                      plan.accent === 'gold' ? 'text-gold' : 'text-teal'
                    }`} />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button 
                variant={plan.popular ? "gold" : "gold-outline"} 
                className="w-full" 
                size="lg"
                asChild
              >
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-muted-foreground text-sm mt-12 max-w-2xl mx-auto">
          Investment involves risk. The value of investments can go down as well as up. 
          Past performance is not indicative of future results.
        </p>
      </div>
    </section>
  );
}
