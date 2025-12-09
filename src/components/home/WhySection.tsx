import { Shield, Eye, TrendingUp, Lock } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description: "Your investments are protected with advanced encryption and multi-layer security protocols.",
    color: "gold",
  },
  {
    icon: Eye,
    title: "Manual Verification",
    description: "Every payment is personally verified by our team ensuring complete accuracy and transparency.",
    color: "teal",
  },
  {
    icon: TrendingUp,
    title: "Curated Opportunities",
    description: "Access carefully selected crypto investment strategies designed for sustainable growth.",
    color: "gold",
  },
  {
    icon: Lock,
    title: "Risk Management",
    description: "Our expert team monitors market conditions to protect and optimize your investments.",
    color: "teal",
  },
];

export function WhySection() {
  return (
    <section id="about" className="py-20 md:py-32 relative">
      {/* Background accent */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-gold/5 rounded-full blur-3xl -translate-y-1/2" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-gold text-sm font-semibold tracking-wider uppercase mb-4 block">
            Why Choose Us
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
            Why <span className="text-gradient-gold">FutureFunds</span>?
          </h2>
          <p className="text-muted-foreground text-lg">
            We combine cutting-edge technology with human expertise to deliver 
            a secure and transparent investment experience.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-8 rounded-2xl bg-card border border-border hover:border-gold/30 transition-all duration-500 hover:shadow-gold"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${
                feature.color === 'gold' 
                  ? 'bg-gold/10 text-gold' 
                  : 'bg-teal/10 text-teal'
              } group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-gold transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
