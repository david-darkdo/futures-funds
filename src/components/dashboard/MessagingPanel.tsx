import { Shield, TrendingUp, Clock, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Message {
  id: string;
  icon: "shield" | "trending" | "clock" | "sparkles";
  title: string;
  description: string;
}

interface MessagingPanelProps {
  hasActiveInvestment: boolean;
  loading?: boolean;
}

const iconMap = {
  shield: Shield,
  trending: TrendingUp,
  clock: Clock,
  sparkles: Sparkles
};

const activeMessages: Message[] = [
  {
    id: "1",
    icon: "trending",
    title: "Your investment is actively compounding",
    description: "Capital is being allocated across diversified growth strategies"
  },
  {
    id: "2",
    icon: "shield",
    title: "Capital allocation optimized",
    description: "Your portfolio is balanced for consistent, sustainable returns"
  },
  {
    id: "3",
    icon: "clock",
    title: "Next growth update in 24h",
    description: "Daily returns are calculated and applied automatically"
  },
  {
    id: "4",
    icon: "sparkles",
    title: "Growth on track",
    description: "Your investment is performing within expected parameters"
  }
];

const pendingMessages: Message[] = [
  {
    id: "1",
    icon: "clock",
    title: "Payment verification in progress",
    description: "Our team is reviewing your payment submission"
  },
  {
    id: "2",
    icon: "shield",
    title: "Your funds are secure",
    description: "Once verified, your investment will begin compounding"
  }
];

export function MessagingPanel({ hasActiveInvestment, loading = false }: MessagingPanelProps) {
  const messages = hasActiveInvestment ? activeMessages : pendingMessages;

  if (loading) {
    return (
      <div className="p-6 rounded-xl bg-card border border-border">
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-4 rounded-lg bg-secondary/50">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <h3 className="font-semibold text-foreground mb-6">System Updates</h3>
      <div className="space-y-3">
        {messages.map((message) => {
          const Icon = iconMap[message.icon];
          
          return (
            <div
              key={message.id}
              className="flex gap-3 p-4 rounded-lg bg-secondary/50 border border-border/50"
            >
              <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{message.title}</p>
                <p className="text-sm text-muted-foreground">{message.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}