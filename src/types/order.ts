import { CartItem } from "./product";

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  district: string;
  tradePlace: string;
  area: string;
  address: string;
}

// Keep old name as alias for backwards compatibility in contexts
export type ShippingAddress = DeliveryAddress;

export interface PaymentMethod {
  type: "airtel_money" | "mpamba" | "bank_transfer";
  phoneNumber?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  shippingAddress: DeliveryAddress;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  estimatedDelivery: Date;
  trackingNumber?: string;
  trackingEvents: TrackingEvent[];
}

export type OrderStatus = 
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface TrackingEvent {
  status: OrderStatus;
  description: string;
  location?: string;
  timestamp: Date;
}
