import { useState } from "react";
import { TrendingUp, Shield, Clock, Sparkles, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PaymentUploadDialog } from "@/components/payments/PaymentUploadDialog";
import { CreateDemoDialog } from "@/components/dashboard/CreateDemoDialog";

const features = [
  {
    icon: TrendingUp,
    title: "Daily Growth",
    description: "Watch your investment grow daily with our proprietary growth strategies"
  },
  {
    icon: Shield,
    title: "Secure & Protected",
    description: "Your funds are protected with industry-leading security measures"
  },
  {
    icon: Clock,
    title: "24/7 Access",
    description: "Monitor your portfolio and request withdrawals anytime"
  },
  {
    icon: Sparkles,
    title: "Premium Support",
    description: "Get dedicated support from our investment specialists"
  }
];

export default function DashboardStart() {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);

  return (
    <div className="flex-1 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 border border-gold/20 mb-6">
            <TrendingUp className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            Start Your Investment Journey
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose an investment bundle and begin growing your wealth with Future Funds Hub. 
            Our proven strategies help maximize your returns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {features.map((feature) => (
            <Card key={feature.title} className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="p-2 rounded-lg bg-gold/10">
                  <feature.icon className="w-5 h-5 text-gold" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="gold"
            size="lg"
            onClick={() => setPaymentDialogOpen(true)}
            className="gap-2 px-8"
          >
            <Sparkles className="w-5 h-5" />
            Start New Investment
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setDemoDialogOpen(true)}
                className="gap-2 px-8 border-gold/30 text-gold hover:bg-gold/10 hover:text-gold"
              >
                <FlaskConical className="w-5 h-5" />
                Try Demo Investment
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Experience real-time investment growth with simulated funds. See how your portfolio grows with our 3-day cycle: +25%, hold, -10%. No real money needed!</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Select a bundle to invest, or try a risk-free demo first
        </p>
      </div>

      <PaymentUploadDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
      />
      <CreateDemoDialog
        open={demoDialogOpen}
        onOpenChange={setDemoDialogOpen}
      />
    </div>
  );
}
