import { Link } from "react-router-dom";
import { Package, ChevronRight, Eye, Loader2 } from "lucide-react";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { Button } from "@/components/ui/button";
import { useOrders, useOrderItems } from "@/hooks/useOrders";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { format } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

const statusColors: Record<string, string> = {
  pending: "bg-warning/20 text-warning",
  confirmed: "bg-primary/20 text-primary",
  processing: "bg-primary/20 text-primary",
  shipped: "bg-accent/20 text-accent-foreground",
  in_transit: "bg-accent/20 text-accent-foreground",
  out_for_delivery: "bg-accent/20 text-accent-foreground",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-destructive/20 text-destructive",
};

const paymentStatusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Payment Pending", className: "bg-warning/20 text-warning" },
  paid: { label: "Paid", className: "bg-green-100 text-green-700" },
  failed: { label: "Payment Failed", className: "bg-destructive/20 text-destructive" },
};

const OrderItemsModal = ({ orderId, open, onClose }: { orderId: string; open: boolean; onClose: () => void }) => {
  const { data: items = [], isLoading } = useOrderItems(orderId);
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("orderItems")}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                {item.product?.image && (
                  <img src={item.product.image} alt={item.product?.title || ""} className="w-16 h-16 object-cover rounded" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-2">{item.product?.title || "Product"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("quantity")}: {item.quantity} × ${item.price.toFixed(2)}
                  </p>
                </div>
                <p className="font-medium text-sm">${(item.quantity * item.price).toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const Orders = () => {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useOrders();
  const { format: formatCurrency } = useCurrency();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { t } = useTranslation();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center">
          <p className="text-muted-foreground mb-4">{t("pleaseSignInOrders")}</p>
          <Link to="/auth"><Button>{t("signIn")}</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">{t("home")}</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">{t("myOrders")}</span>
        </div>

        <h1 className="text-2xl font-bold mb-6">{t("myOrders")}</h1>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-lg shadow-sm">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-lg font-medium mb-2">{t("noOrdersYet")}</h2>
            <p className="text-muted-foreground mb-6">{t("startShopping")}</p>
            <Link to="/"><Button>{t("browseProducts")}</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const address = order.shipping_address as any;
              return (
                <div key={order.id} className="bg-card rounded-lg shadow-sm p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-sm font-medium">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[order.status || "pending"] || statusColors.pending}`}>
                          {(order.status || "pending").replace("_", " ")}
                        </span>
                        {(() => {
                          const ps = paymentStatusConfig[(order as any).payment_status || "pending"];
                          return ps ? (
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ps.className}`}>
                              {ps.label}
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatCurrency(order.total)}</p>
                      {order.estimated_delivery && (
                        <p className="text-xs text-muted-foreground">
                          {t("estDelivery")}: {format(new Date(order.estimated_delivery), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  </div>

                  {address && (
                    <p className="text-xs text-muted-foreground mb-3">
                      {t("deliverTo")}: {address.full_name}, {address.city || address.country}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-3 border-t">
                    <Button variant="outline" size="sm" onClick={() => setSelectedOrderId(order.id)}>
                      <Eye className="w-4 h-4 mr-1" /> {t("viewItems")}
                    </Button>
                    {order.tracking_number && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {t("tracking")}: <span className="font-mono">{order.tracking_number}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />

      {selectedOrderId && (
        <OrderItemsModal
          orderId={selectedOrderId}
          open={!!selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
};

export default Orders;
