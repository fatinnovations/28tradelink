import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Order, ShippingAddress, PaymentMethod, TrackingEvent } from "@/types/order";
import { CartItem } from "@/types/product";

interface OrderContextType {
  orders: Order[];
  currentOrder: Partial<Order> | null;
  setShippingAddress: (address: ShippingAddress) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  createOrder: (items: CartItem[], subtotal: number) => Order;
  getOrder: (orderId: string) => Order | undefined;
  clearCurrentOrder: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const generateOrderId = () => {
  return `28TL${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
};

const generateTrackingNumber = () => {
  return `TRK${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem("orders");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((o: Order) => ({
        ...o,
        createdAt: new Date(o.createdAt),
        estimatedDelivery: new Date(o.estimatedDelivery),
        trackingEvents: o.trackingEvents.map((e: TrackingEvent) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        })),
      }));
    }
    return [];
  });

  const [currentOrder, setCurrentOrder] = useState<Partial<Order> | null>(null);

  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  const setShippingAddress = (address: ShippingAddress) => {
    setCurrentOrder((prev) => ({
      ...prev,
      shippingAddress: address,
    }));
  };

  const setPaymentMethod = (method: PaymentMethod) => {
    setCurrentOrder((prev) => ({
      ...prev,
      paymentMethod: method,
    }));
  };

  const createOrder = (items: CartItem[], subtotal: number): Order => {
    const now = new Date();
    const estimatedDelivery = new Date(now);
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 15 + Math.floor(Math.random() * 15));

    const order: Order = {
      id: generateOrderId(),
      items,
      shippingAddress: currentOrder?.shippingAddress!,
      paymentMethod: currentOrder?.paymentMethod!,
      subtotal,
      shippingCost: 0,
      total: subtotal,
      status: "confirmed",
      createdAt: now,
      estimatedDelivery,
      trackingNumber: generateTrackingNumber(),
      trackingEvents: [
        {
          status: "confirmed",
          description: "Order confirmed and payment received",
          timestamp: now,
        },
      ],
    };

    setOrders((prev) => [order, ...prev]);
    setCurrentOrder(null);
    return order;
  };

  const getOrder = (orderId: string) => {
    return orders.find((o) => o.id === orderId);
  };

  const clearCurrentOrder = () => {
    setCurrentOrder(null);
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        currentOrder,
        setShippingAddress,
        setPaymentMethod,
        createOrder,
        getOrder,
        clearCurrentOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
};
