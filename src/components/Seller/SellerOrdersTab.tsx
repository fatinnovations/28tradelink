import { useState } from "react";
import { format } from "date-fns";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useSellerOrders,
  useUpdateOrderStatus,
  type SellerOrderWithItems,
} from "@/hooks/useSellerOrders";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  pending: { label: "Pending", icon: Clock, color: "bg-warning" },
  confirmed: { label: "Confirmed", icon: CheckCircle, color: "bg-primary" },
  processing: { label: "Processing", icon: Package, color: "bg-secondary" },
  shipped: { label: "Shipped", icon: Truck, color: "bg-primary/80" },
  in_transit: { label: "In Transit", icon: Truck, color: "bg-secondary/80" },
  out_for_delivery: {
    label: "Out for Delivery",
    icon: Truck,
    color: "bg-primary/70",
  },
  delivered: { label: "Delivered", icon: CheckCircle, color: "bg-success" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "bg-destructive" },
};

interface OrderCardProps {
  order: SellerOrderWithItems;
}

const OrderCard = ({ order }: OrderCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newStatus, setNewStatus] = useState(order.status || "pending");
  const { format: formatCurrency } = useCurrency();
  const [trackingNumber, setTrackingNumber] = useState(
    order.tracking_number || ""
  );
  const { mutate: updateStatus, isPending } = useUpdateOrderStatus();
  const { toast } = useToast();

  const status = statusConfig[order.status || "pending"];
  const StatusIcon = status?.icon || Clock;

  const shippingAddress = order.shipping_address as {
    full_name?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };

  const handleUpdateStatus = () => {
    updateStatus(
      {
        orderId: order.id,
        status: newStatus,
        trackingNumber: trackingNumber || undefined,
      },
      {
        onSuccess: () => {
          toast({
            title: "Order updated",
            description: `Order status changed to ${statusConfig[newStatus]?.label || newStatus}`,
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  // Calculate seller's portion of the order
  const sellerTotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${status?.color || "bg-gray-500"}`}>
              <StatusIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">
                Order #{order.id.slice(0, 8)}
              </CardTitle>
              <CardDescription>
                {format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}
              </CardDescription>
            </div>
          </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-bold text-lg">{formatCurrency(sellerTotal)}</p>
                <div className="flex items-center gap-2 justify-end">
                  <Badge variant="outline">{order.items.length} item(s)</Badge>
                  {(() => {
                    const ps = (order as any).payment_status || "pending";
                    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
                      pending: { label: "💳 Unpaid", variant: "secondary" },
                      paid: { label: "✅ Paid", variant: "default" },
                      failed: { label: "❌ Failed", variant: "destructive" },
                    };
                    const c = config[ps] || config.pending;
                    return <Badge variant={c.variant}>{c.label}</Badge>;
                  })()}
                </div>
              </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Order Items */}
          <div>
            <h4 className="font-medium mb-3">Items</h4>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
                >
                  <img
                    src={item.product?.image || "/placeholder.svg"}
                    alt={item.product?.title || "Product"}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium line-clamp-1">
                      {item.product?.title || "Unknown Product"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity} × {formatCurrency(item.price)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Store: {item.product?.store?.name || "Unknown"}
                    </p>
                  </div>
                  <p className="font-bold">
                    {formatCurrency(item.quantity * item.price)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <h4 className="font-medium mb-2">Delivery Address</h4>
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium">{shippingAddress.full_name}</p>
              <p>{shippingAddress.country} — {shippingAddress.city}</p>
              <p>{shippingAddress.state}</p>
              <p>{shippingAddress.address}</p>
            </div>
          </div>

          {/* Update Status */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Update Order Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tracking Number</Label>
                <Input
                  placeholder="Enter tracking number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleUpdateStatus}
                  disabled={isPending}
                  className="w-full"
                >
                  {isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Update Order
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

const SellerOrdersTab = () => {
  const { data: orders, isLoading, error } = useSellerOrders();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Error loading orders</h3>
          <p className="text-muted-foreground">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No orders yet</h3>
          <p className="text-muted-foreground">
            When customers purchase your products, orders will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter);

  // Calculate stats
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const processingCount = orders.filter(
    (o) => o.status === "processing" || o.status === "confirmed"
  ).length;
  const shippedCount = orders.filter(
    (o) =>
      o.status === "shipped" ||
      o.status === "in_transit" ||
      o.status === "out_for_delivery"
  ).length;
  const completedCount = orders.filter((o) => o.status === "delivered").length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" />
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-secondary" />
              <span className="text-sm text-muted-foreground">Processing</span>
            </div>
            <p className="text-2xl font-bold">{processingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Shipped</span>
            </div>
            <p className="text-2xl font-bold">{shippedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-sm text-muted-foreground">Completed</span>
            </div>
            <p className="text-2xl font-bold">{completedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex justify-between items-center">
        <h3 className="font-medium">All Orders ({orders.length})</h3>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(statusConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
};

export default SellerOrdersTab;
