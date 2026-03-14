import { useParams, Link } from "react-router-dom";
import { ChevronRight, SlidersHorizontal } from "lucide-react";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import ProductCard from "@/components/Product/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Category = () => {
  const { id } = useParams();
  const { data: categories } = useCategories();
  const { data: products, isLoading } = useProducts({ categoryId: id });
  const [sortBy, setSortBy] = useState("default");
  const { t } = useTranslation();

  const category = categories?.find((c) => c.id === id);

  const sortedProducts = [...(products || [])].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "sold":
        return (b.sold || 0) - (a.sold || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">{t("home")}</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">{category?.name || t("categoryLabel")}</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{category?.name || t("categoryLabel")}</h1>
            <p className="text-muted-foreground text-sm">{sortedProducts.length} {t("productsFound")}</p>
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-44">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t("sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">{t("bestMatch")}</SelectItem>
              <SelectItem value="price-low">{t("priceLowHigh")}</SelectItem>
              <SelectItem value="price-high">{t("priceHighLow")}</SelectItem>
              <SelectItem value="rating">{t("highestRating")}</SelectItem>
              <SelectItem value="sold">{t("mostSold")}</SelectItem>
            </SelectContent>
          </Select>
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
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-lg">
            <p className="text-muted-foreground mb-4">{t("noProductsCategory")}</p>
            <Link to="/" className="text-primary hover:underline">{t("browseAllProducts")}</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Category;
