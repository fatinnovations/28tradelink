import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, Heart, Share2, Truck, Shield, RotateCcw, Minus, Plus, ShoppingCart, Zap, ChevronRight, Store, MessageSquare } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useProduct } from "@/hooks/useProducts";
import { useAddToCart } from "@/hooks/useCart";
import { useIsFollowingStore, useToggleFollowStore } from "@/hooks/useStores";
import { useIsInWishlist, useToggleWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: product, isLoading } = useProduct(id);
  const addToCart = useAddToCart();
  const toggleFollow = useToggleFollowStore();
  const toggleWishlist = useToggleWishlist();
  const { data: isFollowing } = useIsFollowingStore(product?.store_id);
  const { data: isInWishlist } = useIsInWishlist(id);
  
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { format: formatCurrency } = useCurrency();

  const handleFollow = () => {
    if (!user) {
      toast.error("Please sign in to follow stores");
      navigate("/auth");
      return;
    }
    if (product?.store_id) {
      toggleFollow.mutate(
        { storeId: product.store_id, isFollowing: !!isFollowing },
        {
          onSuccess: () => {
            toast.success(isFollowing ? `Unfollowed ${product.store?.name}` : `Now following ${product.store?.name}!`);
          },
        }
      );
    }
  };

  const handleToggleWishlist = () => {
    if (!user) {
      toast.error("Please sign in to add to wishlist");
      navigate("/auth");
      return;
    }
    if (id) {
      toggleWishlist.mutate(
        { productId: id, isInWishlist: !!isInWishlist },
        {
          onSuccess: () => {
            toast.success(isInWishlist ? "Removed from wishlist" : "Added to wishlist!");
          },
        }
      );
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      toast.error("Please sign in to add to cart");
      navigate("/auth");
      return;
    }
    if (id) {
      addToCart.mutate(
        { productId: id, quantity },
        {
          onSuccess: () => {
            toast.success("Added to cart!", {
              description: `${quantity}x ${product?.title.slice(0, 30)}...`,
            });
          },
        }
      );
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      toast.error("Please sign in to purchase");
      navigate("/auth");
      return;
    }
    if (id) {
      addToCart.mutate(
        { productId: id, quantity },
        {
          onSuccess: () => {
            toast.success("Proceeding to checkout...");
            navigate("/checkout");
          },
        }
      );
    }
  };

  const formatNumber = (num: number | null | undefined) => {
    if (!num) return "0";
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-4">
          <Skeleton className="h-4 w-64 mb-4" />
          <div className="bg-card rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Skeleton className="aspect-square w-full" />
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link to="/" className="text-primary hover:underline">
            Return to Home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const images = product.images?.length ? product.images : [product.image];
  const originalPrice = product.original_price;
  const discount = originalPrice ? Math.round((1 - product.price / originalPrice) * 100) : null;
  const store = product.store;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground truncate max-w-xs">{product.title}</span>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div>
              <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-4">
                <img
                  src={images[selectedImage] || "/placeholder.svg"}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2">
                {images.slice(0, 4).map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-16 h-16 rounded border-2 overflow-hidden transition-colors ${
                      selectedImage === index ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={img || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div>
              {product.is_choice && (
                <div className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded mb-3">
                  <span className="font-medium">Choice</span>
                </div>
              )}

              <h1 className="text-xl font-medium text-foreground mb-4 leading-relaxed">
                {product.title}
              </h1>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-star text-star" />
                  <span className="font-medium">{product.rating?.toFixed(1) || "0.0"}</span>
                  <span className="text-muted-foreground">({formatNumber(product.reviews)} reviews)</span>
                </div>
                <span className="text-muted-foreground">|</span>
                <span className="text-muted-foreground">{formatNumber(product.sold)} sold</span>
              </div>

              {/* Price */}
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-price">{formatCurrency(product.price)}</span>
                  {originalPrice && (
                    <>
                      <span className="text-lg text-muted-foreground line-through">
                        {formatCurrency(originalPrice)}
                      </span>
                      <span className="deal-badge">-{discount}%</span>
                    </>
                  )}
                </div>
              </div>

              {/* Shipping */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {product.free_shipping ? (
                        <span className="text-shipping">Free Shipping</span>
                      ) : (
                        <span>Shipping: {formatCurrency(product.shipping_price || 0)}</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">Estimated delivery: 15-30 days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Buyer Protection</p>
                    <p className="text-sm text-muted-foreground">Full refund if item isn't as described</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RotateCcw className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Free Returns</p>
                    <p className="text-sm text-muted-foreground">Within 15 days of delivery</p>
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-muted-foreground">Quantity:</span>
                <div className="flex items-center border rounded">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-muted transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-muted transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mb-6">
                <Button
                  onClick={handleBuyNow}
                  className="flex-1 h-12 text-base font-medium"
                  disabled={addToCart.isPending}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Buy Now
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAddToCart}
                  className="flex-1 h-12 text-base font-medium border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  disabled={addToCart.isPending}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={handleToggleWishlist}
                  className={`flex items-center gap-1 text-sm transition-colors ${
                    isInWishlist ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isInWishlist ? "fill-primary" : ""}`} />
                  {isInWishlist ? "In Wishlist" : "Add to Wishlist"}
                </button>
                <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Store Info */}
        {store && (
          <div className="bg-card rounded-lg shadow-sm p-4 mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <Link to={`/store/${store.id}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                  {store.logo ? (
                    <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{store.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{store.rating || 95}% Positive</span>
                    <span>|</span>
                    <span>{formatNumber(store.followers)} Followers</span>
                  </div>
                </div>
              </Link>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!user) {
                      toast.error("Please sign in to chat with seller");
                      navigate("/auth");
                      return;
                    }
                    if (store.owner_id) {
                      navigate(`/messages?storeId=${store.id}&sellerId=${store.owner_id}`);
                    }
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Chat with Seller
                </Button>
                <Button 
                  variant={isFollowing ? "outline" : "default"} 
                  size="sm"
                  onClick={handleFollow}
                  disabled={toggleFollow.isPending}
                >
                  <Heart className={`w-4 h-4 mr-1 ${isFollowing ? "fill-primary text-primary" : ""}`} />
                  {isFollowing ? "Following" : "Follow"}
                </Button>
                <Link to={`/store/${store.id}`}>
                  <Button variant="outline" size="sm">
                    Visit Store
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
