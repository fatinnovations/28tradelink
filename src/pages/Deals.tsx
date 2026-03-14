import { useState, useEffect } from "react";
import { Zap, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import ProductCard from "@/components/Product/ProductCard";
import { useFlashDeals } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

const Deals = () => {
  const { data: deals, isLoading } = useFlashDeals(50);
  const { t } = useTranslation();

  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 32, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; minutes = 59; seconds = 59; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (num: number) => num.toString().padStart(2, "0");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">{t("home")}</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">{t("flashDeals")}</span>
        </div>

        <div className="flash-banner rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-white animate-pulse-deal" />
              <h1 className="text-2xl font-bold text-white">{t("flashDeals")}</h1>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white/80 text-sm">{t("endsIn")}</span>
              <span className="countdown-box">{formatTime(timeLeft.hours)}</span>
              <span className="text-white font-bold">:</span>
              <span className="countdown-box">{formatTime(timeLeft.minutes)}</span>
              <span className="text-white font-bold">:</span>
              <span className="countdown-box">{formatTime(timeLeft.seconds)}</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : !deals?.length ? (
          <div className="text-center py-16 bg-card rounded-lg">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t("noFlashDeals")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {deals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Deals;
