import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/Product/ProductCard";
import { ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type SortOption = "default" | "sold" | "price-low" | "price-high";

const ProductGrid = () => {
  const [limit, setLimit] = useState(12);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const { data: products, isLoading } = useProducts({ limit });
  const { t } = useTranslation();

  const loadMore = () => {
    setLimit((prev) => prev + 12);
  };

  const sortedProducts = [...(products || [])].sort((a, b) => {
    switch (sortBy) {
      case "sold": return (b.sold || 0) - (a.sold || 0);
      case "price-low": return a.price - b.price;
      case "price-high": return b.price - a.price;
      default: return 0;
    }
  });

  if (isLoading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-7 w-36" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <h2 className="text-lg sm:text-xl font-bold">{t("moreToLove")}</h2>
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSortBy("default")}
            className={`whitespace-nowrap ${sortBy === "default" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t("bestMatch")}
          </button>
          <button
            onClick={() => setSortBy("sold")}
            className={`whitespace-nowrap ${sortBy === "sold" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t("orders")}
          </button>
          <button
            onClick={() => setSortBy(sortBy === "price-low" ? "price-high" : "price-low")}
            className={`flex items-center gap-1 whitespace-nowrap ${sortBy.startsWith("price") ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t("price")} <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${sortBy === "price-high" ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {sortedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {products && products.length >= limit && (
        <div className="flex justify-center mt-8">
          <button 
            onClick={loadMore}
            className="px-8 py-2.5 border border-primary text-primary rounded-full font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {t("loadMore")}
          </button>
        </div>
      )}
    </section>
  );
};

export default ProductGrid;
