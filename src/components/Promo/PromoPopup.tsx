import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { useActivePromos } from "@/hooks/usePromotionalBanners";
import { useTrackPromoEvent } from "@/hooks/usePromoAnalytics";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const PromoPopup = () => {
  const { data: promos = [] } = useActivePromos();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [currentPopup, setCurrentPopup] = useState<string | null>(null);
  const { trackImpression, trackClick } = useTrackPromoEvent();

  useEffect(() => {
    const stored = localStorage.getItem("dismissed-promo-popups");
    if (stored) {
      try { setDismissed(new Set(JSON.parse(stored))); } catch {}
    }
  }, []);

  const popupPromos = promos.filter(
    (p) => p.banner_type === "popup" && !dismissed.has(p.id)
  );

  useEffect(() => {
    if (popupPromos.length > 0 && !currentPopup) {
      const timer = setTimeout(() => {
        setCurrentPopup(popupPromos[0].id);
        trackImpression(popupPromos[0].id);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [popupPromos, currentPopup]);

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    localStorage.setItem("dismissed-promo-popups", JSON.stringify([...next]));
    setCurrentPopup(null);
  };

  const popup = promos.find((p) => p.id === currentPopup);
  if (!popup) return null;

  return (
    <Dialog open={!!currentPopup} onOpenChange={() => dismiss(popup.id)}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0">
        <div
          className="p-6 text-center"
          style={{
            backgroundColor: popup.background_color || "#ef4444",
            color: popup.text_color || "#ffffff",
          }}
        >
          {popup.image_url && (
            <img
              src={popup.image_url}
              alt={popup.title}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
          )}
          <h2 className="text-2xl font-bold mb-2">{popup.title}</h2>
          {popup.message && <p className="opacity-90 mb-4">{popup.message}</p>}
          <div className="flex items-center justify-center gap-3">
            {popup.link_url && (
              <Link to={popup.link_url} onClick={() => { trackClick(popup.id); dismiss(popup.id); }}>
                <Button className="bg-white/90 text-foreground hover:bg-white font-semibold">
                  {popup.link_text || "Shop Now"}
                </Button>
              </Link>
            )}
            {popup.is_dismissible && (
              <Button
                variant="ghost"
                className="hover:bg-white/20"
                style={{ color: popup.text_color || "#ffffff" }}
                onClick={() => dismiss(popup.id)}
              >
                Maybe Later
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromoPopup;
