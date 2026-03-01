import { useState } from "react";
import { Sparkles, TrendingUp, BarChart3, Shield, Info, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { CreateDemoDialog } from "@/components/dashboard/CreateDemoDialog";

const highlights = [
  {
    icon: TrendingUp,
    title: "Real Growth Simulation",
    description: "Watch your demo investment grow with our 3-day market cycle — just like real trading.",
  },
  {
    icon: BarChart3,
    title: "Live Dashboard",
    description: "Track charts, percentages, and profit tickers on the same dashboard real investors use.",
  },
  {
    icon: Shield,
    title: "Zero Risk",
    description: "No real money involved. Test drive the platform completely risk-free.",
  },
];

export function DemoSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCTA = () => {
    if (user) {
      setDialogOpen(true);
    } else {
      navigate("/signup");
    }
  };

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/[0.03] to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Demo Experience
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Try Before You Invest
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-2">
            Experience the full investment lifecycle with simulated funds. See how real-time growth works, track performance on your dashboard, and feel confident before committing real capital.
          </p>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="inline-flex items-center gap-1 text-sm text-gold hover:text-gold/80 transition-colors mt-2">
                <Info className="w-4 h-4" />
                How does the demo work?
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm text-left">
              <p className="font-medium mb-1">Demo Growth Cycle (repeats every 3 days):</p>
              <ul className="text-xs space-y-1">
                <li><strong>Day 1:</strong> +25% growth on your current balance</li>
                <li><strong>Day 2:</strong> Hold — no changes</li>
                <li><strong>Day 3:</strong> -10% market adjustment</li>
              </ul>
              <p className="text-xs mt-2 text-muted-foreground">Pick any amount to simulate. No real money is used. When you're ready, convert to a real investment!</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {highlights.map((h) => (
            <Card key={h.title} className="bg-card/50 border-border/50 hover:border-gold/30 transition-colors">
              <CardContent className="pt-6">
                <div className="p-2.5 rounded-lg bg-gold/10 w-fit mb-4">
                  <h.icon className="w-5 h-5 text-gold" />
                </div>
                <h3 className="font-semibold mb-2">{h.title}</h3>
                <p className="text-sm text-muted-foreground">{h.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button variant="gold" size="lg" onClick={handleCTA} className="gap-2 px-8">
            <Sparkles className="w-5 h-5" />
            {user ? "Create Demo Investment" : "Sign Up & Try Demo"}
            <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            No credit card needed • Instant access • Full dashboard experience
          </p>
        </div>
      </div>

      {user && <CreateDemoDialog open={dialogOpen} onOpenChange={setDialogOpen} />}
    </section>
  );
}
