import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BundlePlan {
  id: string;
  name: string;
  price_usd: number;
  description: string | null;
  daily_growth_rate: number | null;
  slug: string;
  active: boolean | null;
  min_invest: number | null;
  max_invest: number | null;
}

export function PlansSection() {
  const [bundles, setBundles] = useState<BundlePlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBundles = async () => {
      const { data, error } = await supabase
        .from("bundles")
        .select("*")
        .eq("active", true)
        .order("price_usd", { ascending: true });

      if (!error && data) {
        setBundles(data as unknown as BundlePlan[]);
      }
      setLoading(false);
    };
    fetchBundles();
  }, []);

  // Determine which bundle is "popular" (middle one or second)
  const popularIndex = bundles.length >= 3 ? Math.floor(bundles.length / 2) : -1;
  // Last bundle gets "Best Value" badge
  const bestValueIndex = bundles.length >= 2 ? bundles.length - 1 : -1;

  return (
    <section id="plans" className="py-20 md:py-32 relative">
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
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto">
            {bundles.map((bundle, index) => {
              const isPopular = index === popularIndex;
              const isBestValue = index === bestValueIndex && !isPopular;
              const badgeLabel = isPopular ? "Popular" : isBestValue ? "Best Value" : null;

              return (
                <div
                  key={bundle.id}
                  className={`relative rounded-2xl border p-8 flex flex-col overflow-hidden transition-all duration-300 ${
                    isPopular
                      ? "border-gold/60 shadow-gold-lg scale-[1.02] bg-card"
                      : "border-border bg-card hover:border-gold/30 hover:shadow-gold"
                  }`}
                >
                  {/* Ribbon Badge */}
                  {badgeLabel && (
                    <div className="absolute top-0 right-0 overflow-hidden w-28 h-28 pointer-events-none">
                      <div className="absolute top-[18px] right-[-32px] w-[150px] text-center text-xs font-bold py-1.5 bg-gradient-gold text-primary-foreground rotate-45 shadow-md">
                        {badgeLabel}
                      </div>
                    </div>
                  )}

                  {/* Daily Rate - Prominent */}
                  <div className="mb-4">
                    <span className="text-4xl md:text-5xl font-bold text-gradient-gold">
                      {bundle.daily_growth_rate ?? 0.5}%
                    </span>
                    <span className="text-muted-foreground text-lg ml-2">Daily</span>
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold uppercase mb-6 tracking-wide">
                    {bundle.name}
                  </h3>

                  {/* Plan Details */}
                  <div className="space-y-4 mb-8 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Minimum Invest</span>
                      <span className="font-semibold text-foreground">
                        ${(bundle.min_invest ?? bundle.price_usd).toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-border/50" />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Maximum Invest</span>
                      <span className="font-semibold text-foreground">
                        ${(bundle.max_invest ?? bundle.price_usd * 2).toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-border/50" />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Average Daily</span>
                      <span className="font-semibold text-gold">
                        {bundle.daily_growth_rate ?? 0.5}%
                      </span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    variant={isPopular ? "gold" : "gold-outline"}
                    className="w-full"
                    size="lg"
                    asChild
                  >
                    <Link to="/signup">Deposit</Link>
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-center text-muted-foreground text-sm mt-12 max-w-2xl mx-auto">
          Investment involves risk. The value of investments can go down as well as up.
          Past performance is not indicative of future results. All growth values are admin-managed simulations.
        </p>
      </div>
    </section>
  );
}
