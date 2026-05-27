import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ChevronRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface BundlePlan {
  id: string;
  name: string;
  price_usd: number;
  daily_growth_rate: number | null;
}

export function PlansPreview() {
  const { t } = useTranslation();
  const [bundles, setBundles] = useState<BundlePlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("bundles")
        .select("id, name, price_usd, daily_growth_rate")
        .eq("active", true)
        .order("price_usd", { ascending: true })
        .limit(3);
      setBundles((data || []) as BundlePlan[]);
      setLoading(false);
    })();
  }, []);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{t("plansPreview.title")}</h3>
        <Link to="/plans" className="text-xs text-gold hover:text-gold-light inline-flex items-center gap-1">
          {t("plansPreview.viewAll")} <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      {loading ? (
        <div className="grid gap-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      ) : (
        <div className="grid gap-2">
          {bundles.map((b) => (
            <Link
              key={b.id}
              to="/plans"
              className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border hover:border-gold/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-gold" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{b.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.daily_growth_rate ?? 0.5}% {t("plansPreview.daily")} · ${b.price_usd.toLocaleString()}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
