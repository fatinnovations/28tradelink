import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

interface SellerOrder {
  id: string;
  user_id: string;
  status: string | null;
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

interface SellerOrderItem {
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
    store_id: string;
    store?: {
      id: string;
      name: string;
      owner_id: string | null;
    };
  };
}

export interface SellerOrderWithItems extends SellerOrder {
  items: SellerOrderItem[];
}

export function useSellerOrders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["seller-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First get stores owned by this user
      const { data: stores, error: storesError } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id);

      if (storesError) throw storesError;
      if (!stores || stores.length === 0) return [];

      const storeIds = stores.map((s) => s.id);

      // Get products from these stores
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id")
        .in("store_id", storeIds);

      if (productsError) throw productsError;
      if (!products || products.length === 0) return [];

      const productIds = products.map((p) => p.id);

      // Get order items for these products
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select(
          `
          *,
          product:products(
            id, title, image, price, store_id,
            store:stores(id, name, owner_id)
          )
        `
        )
        .in("product_id", productIds);

      if (itemsError) throw itemsError;
      if (!orderItems || orderItems.length === 0) return [];

      // Get unique order IDs
      const orderIds = [...new Set(orderItems.map((item) => item.order_id))];

      // Fetch orders
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .in("id", orderIds)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Combine orders with their items (only items from seller's products)
      const ordersWithItems: SellerOrderWithItems[] = (orders || []).map(
        (order) => ({
          ...(order as unknown as SellerOrder),
          items: orderItems
            .filter((item) => item.order_id === order.id)
            .map((item) => item as unknown as SellerOrderItem),
        })
      );

      return ordersWithItems;
    },
    enabled: !!user,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
      trackingNumber,
    }: {
      orderId: string;
      status: string;
      trackingNumber?: string;
    }) => {
      const updateData: { status: string; tracking_number?: string } = {
        status,
      };

      if (trackingNumber) {
        updateData.tracking_number = trackingNumber;
      }

      const { data, error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
