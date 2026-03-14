import { useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTrackPromoEvent() {
  const tracked = useRef<Set<string>>(new Set());

  const trackImpression = useCallback((promoId: string) => {
    const key = `impression-${promoId}`;
    if (tracked.current.has(key)) return;
    tracked.current.add(key);
    supabase
      .from("promo_analytics" as any)
      .insert({ promo_id: promoId, event_type: "impression" } as any)
      .then();
  }, []);

  const trackClick = useCallback((promoId: string) => {
    supabase
      .from("promo_analytics" as any)
      .insert({ promo_id: promoId, event_type: "click" } as any)
      .then();
  }, []);

  return { trackImpression, trackClick };
}

export interface PromoAnalyticsSummary {
  promo_id: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

export function usePromoAnalyticsSummary() {
  return useQuery({
    queryKey: ["promo-analytics-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promo_analytics" as any)
        .select("promo_id, event_type");
      if (error) throw error;

      const map = new Map<string, { impressions: number; clicks: number }>();
      for (const row of data as any[]) {
        const entry = map.get(row.promo_id) || { impressions: 0, clicks: 0 };
        if (row.event_type === "impression") entry.impressions++;
        else if (row.event_type === "click") entry.clicks++;
        map.set(row.promo_id, entry);
      }

      const result: PromoAnalyticsSummary[] = [];
      map.forEach((val, promo_id) => {
        result.push({
          promo_id,
          impressions: val.impressions,
          clicks: val.clicks,
          ctr: val.impressions > 0 ? (val.clicks / val.impressions) * 100 : 0,
        });
      });
      return result;
    },
  });
}
