import { useParams, Link } from "react-router-dom";
import { ChevronRight, Package, Truck, CheckCircle2, Clock, MapPin, Box, Home } from "lucide-react";
import { useOrder } from "@/contexts/OrderContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { OrderStatus } from "@/types/order";

const statusSteps: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { status: "processing", label: "Processing", icon: Box },
  { status: "shipped", label: "Shipped", icon: Package },
  { status: "in_transit", label: "In Transit", icon: Truck },
  { status: "out_for_delivery", label: "Out for Delivery", icon: MapPin },
  { status: "delivered", label: "Delivered", icon: Home },
];

const getStatusIndex = (status: OrderStatus) => {
  return statusSteps.findIndex((s) => s.status === status);
};

const OrderTracking = () => {
  const { id } = useParams();
  const { getOrder } = useOrder();
  const { format: formatCurrency } = useCurrency();
  const order = getOrder(id || "");

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't find an order with this ID.
          </p>
          <Link to="/">
            <Button>Return to Home</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const currentStatusIndex = getStatusIndex(order.status);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/account" className="hover:text-primary">My Orders</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">{order.id}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Header */}
            <div className="bg-card rounded-lg shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-xl font-bold">Order #{order.id}</h1>
                  <p className="text-sm text-muted-foreground">
                    Placed on {format(order.createdAt, "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <div className="px-4 py-2 bg-primary/10 rounded-full">
                  <span className="text-sm font-medium text-primary capitalize">
                    {order.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Tracking Progress */}
              <div className="relative">
                <div className="flex justify-between mb-2">
                  {statusSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = index <= currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;

                    return (
                      <div
                        key={step.status}
                        className="flex flex-col items-center relative z-10"
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                            isCompleted
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                            isCurrent && "ring-4 ring-primary/20"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span
                          className={cn(
                            "text-xs mt-2 text-center max-w-[60px]",
                            isCompleted ? "text-foreground font-medium" : "text-muted-foreground"
                          )}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Progress Line */}
                <div className="absolute top-5 left-5 right-5 h-0.5 bg-muted -z-0">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Tracking Events */}
            <div className="bg-card rounded-lg shadow-sm p-6">
              <h2 className="font-bold text-lg mb-4">Tracking History</h2>
              <div className="space-y-4">
                {order.trackingEvents.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full",
                          index === 0 ? "bg-primary" : "bg-muted"
                        )}
                      />
                      {index < order.trackingEvents.length - 1 && (
                        <div className="w-0.5 h-full bg-muted flex-1 my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium">{event.description}</p>
                      {event.location && (
                        <p className="text-sm text-muted-foreground">{event.location}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(event.timestamp, "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-card rounded-lg shadow-sm p-6">
              <h2 className="font-bold text-lg mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.product.id} className="flex gap-4">
                    <Link to={`/product/${item.product.id}`}>
                      <img
                        src={item.product.image}
                        alt={item.product.title}
                        className="w-20 h-20 object-cover rounded"
                      />
                    </Link>
                    <div className="flex-1">
                      <Link to={`/product/${item.product.id}`}>
                        <p className="font-medium line-clamp-2 hover:text-primary">
                          {item.product.title}
                        </p>
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × {formatCurrency(item.product.price)}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Tracking Number */}
            <div className="bg-card rounded-lg shadow-sm p-4">
              <h3 className="font-medium mb-2">Tracking Number</h3>
              <p className="font-mono text-sm bg-muted px-3 py-2 rounded">
                {order.trackingNumber}
              </p>
            </div>

            {/* Delivery Address */}
            <div className="bg-card rounded-lg shadow-sm p-4">
              <h3 className="font-medium mb-2">Delivery Address</h3>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.district} — {order.shippingAddress.tradePlace}</p>
                <p>{order.shippingAddress.area}</p>
                <p>{order.shippingAddress.address}</p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-card rounded-lg shadow-sm p-4">
              <h3 className="font-medium mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t">
                  <span>Total</span>
                  <span className="text-price">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Estimated Delivery */}
            <div className="bg-primary/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-medium">Estimated Delivery</h3>
              </div>
              <p className="text-lg font-bold text-primary">
                {format(order.estimatedDelivery, "MMMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderTracking;
