import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { useActivePromos, type PromotionalBanner } from "@/hooks/usePromotionalBanners";
import { useTrackPromoEvent } from "@/hooks/usePromoAnalytics";

const PromoBanner = () => {
  const { data: promos = [] } = useActivePromos();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const { trackImpression, trackClick } = useTrackPromoEvent();

  useEffect(() => {
    const stored = localStorage.getItem("dismissed-promos");
    if (stored) {
      try { setDismissed(new Set(JSON.parse(stored))); } catch {}
    }
  }, []);

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    localStorage.setItem("dismissed-promos", JSON.stringify([...next]));
  };

  const barPromos = promos.filter(
    (p) => p.banner_type === "bar" && !dismissed.has(p.id)
  );

  // Track impressions for visible bar promos
  useEffect(() => {
    barPromos.forEach((p) => trackImpression(p.id));
  }, [barPromos.map((p) => p.id).join(",")]);

  if (barPromos.length === 0) return null;

  return (
    <div className="w-full">
      {barPromos.map((promo) => (
        <div
          key={promo.id}
          className="relative flex items-center justify-center gap-1.5 sm:gap-3 px-8 sm:px-4 py-2 text-xs sm:text-sm font-medium text-center flex-wrap"
          style={{
            backgroundColor: promo.background_color || "#ef4444",
            color: promo.text_color || "#ffffff",
          }}
        >
          <span className="font-bold">{promo.title}</span>
          {promo.message && <span className="opacity-90">— {promo.message}</span>}
          {promo.link_url && (
            <Link
              to={promo.link_url}
              className="underline font-semibold hover:opacity-80 transition-opacity"
              onClick={() => trackClick(promo.id)}
            >
              {promo.link_text || "Shop Now"}
            </Link>
          )}
          {promo.is_dismissible && (
            <button
              onClick={() => dismiss(promo.id)}
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default PromoBanner;
