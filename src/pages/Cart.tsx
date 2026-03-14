import { Link, useNavigate } from "react-router-dom";
import { Trash2, Minus, Plus, ShoppingCart, ChevronRight, Store, Shield, Truck } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCartItems, useUpdateCartItem, useRemoveFromCart, useClearCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const Cart = () => {
  const { format: formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: cartItems, isLoading } = useCartItems();
  const updateCartItem = useUpdateCartItem();
  const removeFromCart = useRemoveFromCart();
  const clearCart = useClearCart();
  const { t } = useTranslation();
  
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    if (cartItems) {
      setSelectedItems(cartItems.map(i => i.id));
    }
  }, [cartItems]);

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleAll = () => {
    if (!cartItems) return;
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map(i => i.id));
    }
  };

  const selectedTotal = (cartItems || [])
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.product.price * (item.quantity || 1), 0);

  const selectedCount = (cartItems || [])
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + (item.quantity || 1), 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16">
          <div className="text-center">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{t("signInToViewCart")}</h1>
            <p className="text-muted-foreground mb-6">{t("pleaseSignIn")}</p>
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
        <main className="container py-4">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16">
          <div className="text-center">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{t("yourCartIsEmpty")}</h1>
            <p className="text-muted-foreground mb-6">{t("nothingInCart")}</p>
            <Link to="/">
              <Button>{t("continueShopping")}</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary">{t("home")}</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">{t("shoppingCart")}</span>
        </div>

        <h1 className="text-2xl font-bold mb-6">{t("shoppingCart")} ({cartItems.length} {t("items")})</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card rounded-lg shadow-sm p-4 flex items-center gap-4">
              <Checkbox 
                checked={selectedItems.length === cartItems.length}
                onCheckedChange={toggleAll}
              />
              <span className="font-medium">{t("selectAll")} ({cartItems.length} {t("items")})</span>
              <button 
                onClick={() => clearCart.mutate()}
                className="ml-auto text-sm text-muted-foreground hover:text-destructive transition-colors"
                disabled={clearCart.isPending}
              >
                {t("clearCart")}
              </button>
            </div>

            {cartItems.map((item) => (
              <div key={item.id} className="bg-card rounded-lg shadow-sm p-4">
                <div className="flex items-start gap-4">
                  <Checkbox 
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  
                  <Link to={`/product/${item.product.id}`} className="shrink-0">
                    <img
                      src={item.product.image || "/placeholder.svg"}
                      alt={item.product.title}
                      className="w-24 h-24 object-cover rounded"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.product.id}`}>
                      <h3 className="font-medium line-clamp-2 hover:text-primary transition-colors">
                        {item.product.title}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Store className="w-3 h-3" />
                      <span>{item.product.store?.name || "Store"}</span>
                    </div>

                    {item.product.free_shipping && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-shipping">
                        <Truck className="w-3 h-3" />
                        <span>{t("freeShipping")}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-price">
                          {formatCurrency(item.product.price)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center border rounded">
                          <button
                            onClick={() => updateCartItem.mutate({ id: item.id, quantity: (item.quantity || 1) - 1 })}
                            className="p-1.5 hover:bg-muted transition-colors"
                            disabled={updateCartItem.isPending}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center text-sm">{item.quantity || 1}</span>
                          <button
                            onClick={() => updateCartItem.mutate({ id: item.id, quantity: (item.quantity || 1) + 1 })}
                            className="p-1.5 hover:bg-muted transition-colors"
                            disabled={updateCartItem.isPending}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart.mutate(item.id)}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                          disabled={removeFromCart.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-sm p-4 sticky top-24">
              <h2 className="font-bold text-lg mb-4">{t("orderSummary")}</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("subtotal")} ({selectedCount} {t("items")})</span>
                  <span>{formatCurrency(selectedTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("delivery")}</span>
                  <span className="text-shipping">{t("free")}</span>
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between">
                  <span className="font-bold">{t("total")}</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-price">{formatCurrency(selectedTotal)}</span>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full h-12 text-base font-medium mb-3" 
                disabled={selectedItems.length === 0}
                onClick={() => navigate("/checkout")}
              >
                {t("checkout")} ({selectedCount})
              </Button>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>{t("buyerProtectionGuaranteed")}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
