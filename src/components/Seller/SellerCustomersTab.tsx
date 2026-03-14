import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Users,
  Mail,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useSellerOrders, type SellerOrderWithItems } from "@/hooks/useSellerOrders";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface CustomerData {
  userId: string;
  name: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
  orders: SellerOrderWithItems[];
}

const SellerCustomersTab = () => {
  const { format: formatCurrency } = useCurrency();
  const { data: orders = [], isLoading } = useSellerOrders();
  const [search, setSearch] = useState("");
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  const customers = useMemo(() => {
    const customerMap = new Map<string, CustomerData>();

    orders.forEach((order) => {
      const userId = order.user_id;
      const address = order.shipping_address as { full_name?: string } | null;
      const name = address?.full_name || "Unknown Customer";

      const sellerTotal = order.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      if (customerMap.has(userId)) {
        const existing = customerMap.get(userId)!;
        existing.totalOrders += 1;
        existing.totalSpent += sellerTotal;
        existing.orders.push(order);
        if (order.created_at > existing.lastOrder) {
          existing.lastOrder = order.created_at;
          existing.name = name; // Use most recent name
        }
      } else {
        customerMap.set(userId, {
          userId,
          name,
          totalOrders: 1,
          totalSpent: sellerTotal,
          lastOrder: order.created_at,
          orders: [order],
        });
      }
    });

    return Array.from(customerMap.values()).sort(
      (a, b) => b.totalSpent - a.totalSpent
    );
  }, [orders]);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <Users className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{customers.length}</p>
            <p className="text-xs text-muted-foreground">Total Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <ShoppingBag className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">
              {customers.length > 0
                ? (orders.length / customers.length).toFixed(1)
                : 0}
            </p>
            <p className="text-xs text-muted-foreground">Avg Orders/Customer</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="pt-4 text-center">
            <Users className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">
              {customers.filter((c) => c.totalOrders > 1).length}
            </p>
            <p className="text-xs text-muted-foreground">Repeat Customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search customers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customer List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {search ? "No matching customers" : "No customers yet"}
            </h3>
            <p className="text-muted-foreground">
              {search
                ? "Try a different search term"
                : "Customers will appear here when they purchase your products"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((customer) => {
            const isExpanded = expandedCustomer === customer.userId;

            return (
              <Card key={customer.userId}>
                <CardHeader
                  className="cursor-pointer pb-3"
                  onClick={() =>
                    setExpandedCustomer(isExpanded ? null : customer.userId)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">
                          {customer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {customer.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {customer.totalOrders} order{customer.totalOrders !== 1 ? "s" : ""} •
                          Last: {format(new Date(customer.lastOrder), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-sm">
                          {formatCurrency(customer.totalSpent)}
                        </p>
                        {customer.totalOrders > 1 && (
                          <Badge variant="secondary" className="text-[10px]">
                            Repeat
                          </Badge>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="border-t pt-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Order History
                      </p>
                      {customer.orders
                        .sort(
                          (a, b) =>
                            new Date(b.created_at).getTime() -
                            new Date(a.created_at).getTime()
                        )
                        .map((order) => (
                          <div
                            key={order.id}
                            className="flex items-center justify-between p-2 rounded bg-muted/40 text-sm"
                          >
                            <div>
                              <p className="font-medium">
                                #{order.id.slice(0, 8)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(order.created_at), "MMM d, yyyy")} •{" "}
                                {order.items.length} item(s)
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {formatCurrency(
                                  order.items.reduce(
                                    (sum, item) =>
                                      sum + item.price * item.quantity,
                                    0
                                  )
                                )}
                              </p>
                              <Badge
                                variant="outline"
                                className="text-[10px] capitalize"
                              >
                                {(order.status || "pending").replace(/_/g, " ")}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      <div className="pt-2">
                        <Link to="/messages">
                          <Button variant="outline" size="sm" className="w-full">
                            <Mail className="w-3 h-3 mr-2" />
                            Message Customer
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SellerCustomersTab;
