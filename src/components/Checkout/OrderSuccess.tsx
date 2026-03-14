import { Link } from "react-router-dom";
import { CheckCircle2, Package, Truck } from "lucide-react";
import { Order } from "@/types/order";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface OrderSuccessProps {
  order: Order;
}

const OrderSuccess = ({ order }: OrderSuccessProps) => {
  return (
    <div className="text-center max-w-md mx-auto">
      <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10 text-success" />
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-2">Order Placed Successfully!</h1>
      <p className="text-muted-foreground mb-6">
        Thank you for your purchase. Your order has been confirmed.
      </p>

      <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Order Number</p>
            <p className="font-medium">{order.id}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tracking Number</p>
            <p className="font-medium">{order.trackingNumber}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Order Date</p>
            <p className="font-medium">{format(order.createdAt, "MMM d, yyyy")}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Est. Delivery</p>
            <p className="font-medium">{format(order.estimatedDelivery, "MMM d, yyyy")}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-center gap-8 text-sm">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span>Confirmed</span>
          </div>
          <div className="h-0.5 w-8 bg-muted" />
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-2">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-muted-foreground">Processing</span>
          </div>
          <div className="h-0.5 w-8 bg-muted" />
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-2">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-muted-foreground">Shipped</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Link to={`/order/${order.id}`}>
          <Button className="w-full">Track Your Order</Button>
        </Link>
        <Link to="/">
          <Button variant="outline" className="w-full">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;
