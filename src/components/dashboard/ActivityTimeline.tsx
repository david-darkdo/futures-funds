import { Package, Upload, CheckCircle, TrendingUp, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  type: "bundle_purchased" | "payment_submitted" | "payment_approved" | "growth_milestone" | "pending";
  title: string;
  description: string;
  date: string;
  milestone?: number;
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  loading?: boolean;
}

const iconMap = {
  bundle_purchased: Package,
  payment_submitted: Upload,
  payment_approved: CheckCircle,
  growth_milestone: TrendingUp,
  pending: Clock
};

const colorMap = {
  bundle_purchased: "bg-gold/10 text-gold border-gold/20",
  payment_submitted: "bg-secondary text-foreground border-border",
  payment_approved: "bg-teal/10 text-teal border-teal/20",
  growth_milestone: "bg-gold/10 text-gold border-gold/20",
  pending: "bg-secondary text-muted-foreground border-border"
};

export function generateTimelineEvents(
  payments: Array<{
    id: string;
    status: string | null;
    created_at: string | null;
    bundle?: { name: string; price_usd: number };
  }>,
  growthPercent: number
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  payments.forEach(payment => {
    if (payment.bundle && payment.created_at) {
      // Bundle purchased
      events.push({
        id: `${payment.id}-purchase`,
        type: "bundle_purchased",
        title: `${payment.bundle.name} Bundle Selected`,
        description: `Investment of $${payment.bundle.price_usd.toLocaleString()} initiated`,
        date: payment.created_at
      });

      // Payment submitted
      events.push({
        id: `${payment.id}-submitted`,
        type: "payment_submitted",
        title: "Payment Submitted",
        description: "Awaiting verification from management",
        date: payment.created_at
      });

      // Payment approved/pending
      if (payment.status === "approved") {
        events.push({
          id: `${payment.id}-approved`,
          type: "payment_approved",
          title: "Approved by Company",
          description: "Your investment is now active and compounding",
          date: payment.created_at
        });
      } else if (payment.status === "pending") {
        events.push({
          id: `${payment.id}-pending`,
          type: "pending",
          title: "Management Review",
          description: "Your payment is being reviewed",
          date: payment.created_at
        });
      }
    }
  });

  // Add growth milestones
  const milestones = [5, 10, 25, 50, 100];
  milestones.forEach(milestone => {
    if (growthPercent >= milestone) {
      events.push({
        id: `milestone-${milestone}`,
        type: "growth_milestone",
        title: `+${milestone}% Growth Achieved`,
        description: `Your portfolio has grown ${milestone}% since initial investment`,
        date: new Date().toISOString(),
        milestone
      });
    }
  });

  // Sort by date descending
  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function ActivityTimeline({ events, loading = false }: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="p-6 rounded-xl bg-card border border-border">
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-card border border-border">
        <h3 className="font-semibold text-foreground mb-6">Activity Timeline</h3>
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No activity yet</p>
          <p className="text-sm mt-1">Your investment history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <h3 className="font-semibold text-foreground mb-6">Activity Timeline</h3>
      <div className="space-y-4">
        {events.slice(0, 6).map((event, index) => {
          const Icon = iconMap[event.type];
          const colors = colorMap[event.type];
          
          return (
            <div key={event.id} className="flex gap-4">
              <div className="relative">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border",
                  colors
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                {index < events.length - 1 && (
                  <div className="absolute top-10 left-1/2 w-px h-6 bg-border -translate-x-1/2" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <p className="font-medium text-foreground">{event.title}</p>
                <p className="text-sm text-muted-foreground">{event.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}