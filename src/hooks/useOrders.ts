import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

interface Order {
  id: string;
  user_id: string;
  status: string | null;
  payment_status: string | null;
  subtotal: number;
  shipping_cost: number | null;
  tax: number | null;
  total: number;
  shipping_address: Json;
  payment_method: Json;
  tracking_number: string | null;
  estimated_delivery: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  product?: {
    id: string;
    title: string;
    image: string | null;
    price: number;
  };
}

export function useOrders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown) as Order[];
    },
    enabled: !!user,
  });
}

export function useOrder(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      if (!id || !user) return null;
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown) as Order | null;
    },
    enabled: !!id && !!user,
  });
}

export function useOrderItems(orderId: string | undefined) {
  return useQuery({
    queryKey: ["order-items", orderId],
    queryFn: async () => {
      if (!orderId) return [];
      const { data, error } = await supabase
        .from("order_items")
        .select("*, product:products(id, title, image, price)")
        .eq("order_id", orderId);
      if (error) throw error;
      return (data as unknown) as OrderItem[];
    },
    enabled: !!orderId,
  });
}

interface CreateOrderInput {
  items: { productId: string; quantity: number; price: number }[];
  shippingAddress: {
    full_name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  paymentMethod: { type: string; last4?: string };
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
}

export function useCreateOrder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      items,
      shippingAddress,
      paymentMethod,
      subtotal,
      shippingCost,
      tax,
      total,
    }: CreateOrderInput) => {
      if (!user) throw new Error("Must be logged in");

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          status: "pending",
          subtotal,
          shipping_cost: shippingCost,
          tax,
          total,
          shipping_address: shippingAddress as unknown as Json,
          payment_method: paymentMethod as unknown as Json,
          estimated_delivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (orderError) throw orderError;
      if (!order) throw new Error("Failed to create order");

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      await supabase.from("cart_items").delete().eq("user_id", user.id);

      return order as unknown as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}
