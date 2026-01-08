import { UserPlus, Package, Wallet, Upload, CheckCircle, Rocket } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create Account",
    description: "Sign up in seconds with just your email and password.",
  },
  {
    icon: Package,
    step: "02",
    title: "Choose Bundle",
    description: "Select an investment bundle that matches your goals.",
  },
  {
    icon: Wallet,
    step: "03",
    title: "Pay with Crypto",
    description: "Send payment to our secure wallet address using your preferred crypto.",
  },
  {
    icon: Upload,
    step: "04",
    title: "Upload Proof",
    description: "Submit your transaction screenshot for verification.",
  },
  {
    icon: CheckCircle,
    step: "05",
    title: "Management Verifies",
    description: "Our team manually reviews and approves your payment.",
  },
  {
    icon: Rocket,
    step: "06",
    title: "Start Growing",
    description: "Your dashboard activates and investment journey begins.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-32 relative bg-card/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-gold text-sm font-semibold tracking-wider uppercase mb-4 block">
            Simple Process
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
            How It <span className="text-gradient-gold">Works</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Getting started with FutureFunds is simple and straightforward. 
            Follow these steps to begin your investment journey.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={step.step}
              className="relative group"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-full h-px bg-gradient-to-r from-border to-transparent" />
              )}
              
              <div className="p-6 rounded-2xl bg-background border border-border group-hover:border-gold/30 transition-all duration-500 hover:shadow-gold relative z-10">
                {/* Step Number */}
                <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center text-sm font-bold text-primary-foreground shadow-gold">
                  {step.step}
                </div>
                
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                  <step.icon className="w-6 h-6 text-gold" />
                </div>
                
                {/* Content */}
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
