import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "react-router-dom";
import { useWishlist, useToggleWishlist } from "@/hooks/useWishlist";
import { useAddToCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const Wishlist = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: wishlistItems, isLoading } = useWishlist();
  const toggleWishlist = useToggleWishlist();
  const addToCart = useAddToCart();
  const { t } = useTranslation();

  const handleAddToCart = (productId: string, title: string) => {
    addToCart.mutate(
      { productId, quantity: 1 },
      {
        onSuccess: () => {
          toast.success(t("addedToCart"));
        },
      }
    );
  };

  const handleRemoveFromWishlist = (productId: string) => {
    toggleWishlist.mutate(
      { productId, isInWishlist: true },
      {
        onSuccess: () => {
          toast.success(t("removedFromWishlist"));
        },
      }
    );
  };

  // Redirect to auth if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16">
          <div className="text-center">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{t("signInToViewWishlist")}</h1>
            <p className="text-muted-foreground mb-6">{t("signInToAccessWishlist")}</p>
            <Link to="/auth">
              <Button>{t("signIn")}</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t("wishlist")} ({wishlistItems?.length || 0} {t("items")})</h1>
        </div>

        {!wishlistItems || wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">{t("yourWishlistEmpty")}</h2>
            <p className="text-muted-foreground mb-6">{t("noSavedItems")}</p>
            <Link to="/">
              <Button>{t("continueShopping")}</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {wishlistItems.map((item) => (
              <div key={item.id} className="bg-card rounded-lg shadow-sm overflow-hidden group">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <Link to={`/product/${item.product.id}`}>
                    <img
                      src={item.product.image || "/placeholder.svg"}
                      alt={item.product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  <button 
                    onClick={() => handleRemoveFromWishlist(item.product.id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow hover:bg-destructive/10 transition-colors"
                    disabled={toggleWishlist.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>

                <div className="p-3">
                  <Link to={`/product/${item.product.id}`}>
                    <h3 className="text-sm line-clamp-2 mb-2 hover:text-primary transition-colors">
                      {item.product.title}
                    </h3>
                  </Link>

                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-xs text-muted-foreground">US $</span>
                    <span className="text-lg font-bold text-price">{item.product.price.toFixed(2)}</span>
                  </div>

                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleAddToCart(item.product.id, item.product.title)}
                    disabled={addToCart.isPending}
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    {t("addToCart")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
