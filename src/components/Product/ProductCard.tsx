import { Star, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslation } from "react-i18next";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    original_price?: number | null;
    originalPrice?: number;
    discount?: number;
    image: string | null;
    rating: number | null;
    reviews: number | null;
    sold: number | null;
    shipping_price?: number | null;
    free_shipping?: boolean | null;
    freeShipping?: boolean;
    is_choice?: boolean | null;
    isChoice?: boolean;
  };
  variant?: "default" | "compact";
}

const ProductCard = ({ product, variant = "default" }: ProductCardProps) => {
  const { format } = useCurrency();
  const { t } = useTranslation();

  const formatNumber = (num: number | null | undefined) => {
    if (!num) return "0";
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k+";
    }
    return num.toString();
  };

  const originalPrice = product.original_price ?? product.originalPrice;
  const freeShipping = product.free_shipping ?? product.freeShipping;
  const isChoice = product.is_choice ?? product.isChoice;
  const discount = originalPrice ? Math.round((1 - product.price / originalPrice) * 100) : null;

  return (
    <Link to={`/product/${product.id}`} className="product-card flex flex-col h-full group">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image || "/placeholder.svg"}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {discount && discount >= 50 && (
          <div className="absolute top-2 left-2 deal-badge">
            -{discount}%
          </div>
        )}
        {isChoice && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded font-medium">
            {t("choice")}
          </div>
        )}
      </div>

      <div className="p-2.5 flex flex-col flex-1">
        <h3 className="text-sm text-foreground line-clamp-2 mb-2 flex-1 leading-snug">
          {product.title}
        </h3>

        <div className="space-y-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-price">{format(product.price)}</span>
            {originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {format(originalPrice)}
              </span>
            )}
          </div>

          {freeShipping ? (
            <div className="flex items-center gap-1 text-shipping text-xs">
              <Truck className="w-3 h-3" />
              <span>{t("freeShipping")}</span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t("shipping")}</p>
          )}

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-star text-star" />
              <span className="font-medium">{product.rating?.toFixed(1) || "0.0"}</span>
              <span className="text-muted-foreground">({formatNumber(product.reviews)})</span>
            </div>
            <span className="text-muted-foreground">{formatNumber(product.sold)} {t("sold")}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
