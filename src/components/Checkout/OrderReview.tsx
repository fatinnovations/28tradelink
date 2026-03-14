import { MapPin, CreditCard, Package } from "lucide-react";
import { DeliveryAddress, PaymentMethod } from "@/types/order";
import { CartItem } from "@/types/product";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface OrderReviewProps {
  items: CartItem[];
  shippingAddress: DeliveryAddress;
  paymentMethod: PaymentMethod;
  subtotal: number;
  onConfirm: () => void;
  onBack: () => void;
  isProcessing?: boolean;
}

const OrderReview = ({
  items,
  shippingAddress,
  paymentMethod,
  subtotal,
  onConfirm,
  onBack,
  isProcessing,
}: OrderReviewProps) => {
  const { format: formatCurrency } = useCurrency();
  const deliveryCost = 0;
  const total = subtotal + deliveryCost;

  const getPaymentDisplay = () => {
    switch (paymentMethod.type) {
      case "airtel_money":
        return `Airtel Money (${paymentMethod.phoneNumber})`;
      case "mpamba":
        return `TNM Mpamba (${paymentMethod.phoneNumber})`;
      case "bank_transfer":
        return `Bank Transfer — ${paymentMethod.bankName} (${paymentMethod.accountName})`;
      default:
        return "Unknown";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="font-medium">Delivery Address</h3>
        </div>
        <div className="text-sm space-y-1">
          <p className="font-medium">{shippingAddress.fullName}</p>
          <p className="text-muted-foreground">{shippingAddress.phone}</p>
          <p className="text-muted-foreground">
            {shippingAddress.district} — {shippingAddress.tradePlace}
          </p>
          <p className="text-muted-foreground">{shippingAddress.area}</p>
          <p className="text-muted-foreground">{shippingAddress.address}</p>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-5 h-5 text-primary" />
          <h3 className="font-medium">Payment Method</h3>
        </div>
        <p className="text-sm text-muted-foreground">{getPaymentDisplay()}</p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-primary" />
          <h3 className="font-medium">Order Items ({items.length})</h3>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.product.id} className="flex gap-3">
              <img
                src={item.product.image}
                alt={item.product.title}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm line-clamp-2">{item.product.title}</p>
                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-medium">
                {formatCurrency(item.product.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border rounded-lg p-4">
        <h3 className="font-medium mb-4">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery</span>
            <span className="text-green-600 font-medium">Free</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span className="text-price">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={isProcessing}>
          Back
        </Button>
        <Button onClick={onConfirm} className="flex-1" disabled={isProcessing}>
          {isProcessing ? "Processing..." : `Place Order • ${formatCurrency(total)}`}
        </Button>
      </div>
    </div>
  );
};

export default OrderReview;
