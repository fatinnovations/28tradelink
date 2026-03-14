import { useState, useEffect } from "react";
import { Zap, ChevronRight } from "lucide-react";
import { useFlashDeals } from "@/hooks/useProducts";
import ProductCard from "@/components/Product/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const FlashDeals = () => {
  const { data: flashDeals, isLoading } = useFlashDeals(5);
  const { t } = useTranslation();
  
  const [timeLeft, setTimeLeft] = useState({
    hours: 5,
    minutes: 32,
    seconds: 45,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 23;
          minutes = 59;
          seconds = 59;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (num: number) => num.toString().padStart(2, "0");

  if (isLoading) {
    return (
      <section className="bg-card rounded-lg shadow-sm overflow-hidden">
        <div className="flash-banner p-4">
          <Skeleton className="h-8 w-48 bg-white/20" />
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!flashDeals?.length) return null;

  return (
    <section className="bg-card shadow-sm overflow-hidden">
      <div className="flash-banner px-3 py-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse-deal" />
            <h2 className="text-base sm:text-xl font-bold text-white">{t("flashDealsTitle")}</h2>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-white/80 text-xs sm:text-sm">{t("endsIn")}</span>
            <span className="countdown-box text-xs sm:text-sm">{formatTime(timeLeft.hours)}</span>
            <span className="text-white font-bold text-xs sm:text-sm">:</span>
            <span className="countdown-box text-xs sm:text-sm">{formatTime(timeLeft.minutes)}</span>
            <span className="text-white font-bold text-xs sm:text-sm">:</span>
            <span className="countdown-box text-xs sm:text-sm">{formatTime(timeLeft.seconds)}</span>
          </div>
        </div>
        <Link to="/deals" className="flex items-center gap-1 text-white hover:underline self-end sm:self-auto">
          <span className="text-xs sm:text-sm font-medium">{t("viewAll")}</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {flashDeals.map((product) => (
            <ProductCard key={product.id} product={product} variant="compact" />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FlashDeals;
