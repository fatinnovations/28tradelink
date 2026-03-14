import { Award, Truck, Shield } from "lucide-react";
import { useChoiceProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/Product/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

const ChoiceSection = () => {
  const { data: choiceProducts, isLoading } = useChoiceProducts(6);
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <section className="bg-card rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-secondary p-4">
          <Skeleton className="h-8 w-32 bg-white/20" />
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
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

  if (!choiceProducts?.length) return null;

  return (
    <section className="bg-card rounded-lg shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-primary to-secondary p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg px-3 py-1">
              <span className="text-primary font-bold text-lg">{t("choice")}</span>
            </div>
            <div className="text-white">
              <p className="font-medium">{t("topSelections")}</p>
              <p className="text-sm opacity-90">{t("qualityProducts")}</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-white text-sm">
            <div className="flex items-center gap-1">
              <Truck className="w-4 h-4" />
              <span>{t("freeShipping")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span>{t("buyerProtection")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="w-4 h-4" />
              <span>{t("topQuality")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {choiceProducts.map((product) => (
            <ProductCard key={product.id} product={product} variant="compact" />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ChoiceSection;
