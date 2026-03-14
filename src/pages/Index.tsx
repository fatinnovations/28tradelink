import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import Header from "@/components/Header/Header";
import HeroBanner from "@/components/Home/HeroBanner";
import CategorySidebar from "@/components/Home/CategorySidebar";
import FlashDeals from "@/components/Home/FlashDeals";
import ChoiceSection from "@/components/Home/ChoiceSection";
import ProductGrid from "@/components/Home/ProductGrid";
import Footer from "@/components/Footer/Footer";
import PromoBanner from "@/components/Promo/PromoBanner";
import PromoPopup from "@/components/Promo/PromoPopup";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

const Index = () => {
  const queryClient = useQueryClient();

  const onRefresh = useCallback(async () => {
    await queryClient.invalidateQueries();
    // Small delay so the spinner is visible
    await new Promise((r) => setTimeout(r, 600));
  }, [queryClient]);

  const { containerRef, pullDistance, isRefreshing } = usePullToRefresh({ onRefresh });

  return (
    <div ref={containerRef} className="min-h-screen bg-background relative">
      {/* Pull-to-refresh indicator (mobile only) */}
      <div
        className="md:hidden flex items-center justify-center overflow-hidden transition-all duration-200 bg-muted/50"
        style={{ height: pullDistance > 0 ? `${pullDistance}px` : 0 }}
      >
        <RefreshCw
          className={`w-5 h-5 text-muted-foreground transition-transform ${isRefreshing ? "animate-spin" : ""}`}
          style={{ transform: isRefreshing ? undefined : `rotate(${pullDistance * 3}deg)` }}
        />
      </div>

      <PromoBanner />
      <Header />
      <PromoPopup />
      
      <main className="container py-4">
        {/* Hero Section */}
        <div className="flex gap-4 mb-6">
          <CategorySidebar />
          <div className="flex-1">
            <HeroBanner />
          </div>
        </div>

        {/* Flash Deals */}
        <div className="mb-6">
          <FlashDeals />
        </div>

        {/* Choice Section */}
        <div className="mb-6">
          <ChoiceSection />
        </div>

        {/* Product Grid */}
        <ProductGrid />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
