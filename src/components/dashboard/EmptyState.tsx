import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, Shield, Clock, ChevronRight } from "lucide-react";

export function EmptyState() {
  const features = [
    {
      icon: TrendingUp,
      title: "Daily Compounding",
      description: "Your investment grows every day with competitive daily returns"
    },
    {
      icon: Shield,
      title: "Secure & Transparent",
      description: "Track your portfolio in real-time with complete transparency"
    },
    {
      icon: Clock,
      title: "Automated Growth",
      description: "Set it and watch it grow - no active management required"
    }
  ];

  return (
    <div className="p-8 rounded-2xl bg-gradient-to-br from-gold/5 via-card to-card border border-gold/20">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center mx-auto mb-6 shadow-gold">
          <TrendingUp className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">
          Start Your Investment Journey
        </h2>
        <p className="text-muted-foreground">
          Choose an investment bundle to begin growing your capital with our proven growth strategies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="p-4 rounded-xl bg-secondary/50 border border-border/50 text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center mx-auto mb-3">
              <feature.icon className="w-5 h-5 text-gold" />
            </div>
            <h3 className="font-medium text-foreground mb-1">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <Button variant="gold" size="lg" asChild>
          <Link to="/dashboard/bundles">
            Browse Investment Bundles
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}