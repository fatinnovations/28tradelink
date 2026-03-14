import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface WishlistItemWithProduct {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product: {
    id: string;
    store_id: string;
    category_id: string | null;
    title: string;
    description: string | null;
    price: number;
    original_price: number | null;
    image: string | null;
    images: string[] | null;
    rating: number | null;
    reviews: number | null;
    sold: number | null;
    shipping_price: number | null;
    free_shipping: boolean | null;
    is_choice: boolean | null;
    specifications: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
    store: {
      id: string;
      name: string;
      logo: string | null;
      rating: number | null;
      followers: number | null;
      is_verified: boolean | null;
    } | null;
  };
}

export function useWishlist() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["wishlist", user?.id],
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("*, product:products(*, store:stores(*))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown) as WishlistItemWithProduct[];
    },
    enabled: !!user,
  });
}

export function useIsInWishlist(productId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["in-wishlist", productId, user?.id],
    queryFn: async () => {
      if (!user || !productId) return false;
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!productId,
  });
}

export function useToggleWishlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, isInWishlist }: { productId: string; isInWishlist: boolean }) => {
      if (!user) throw new Error("Must be logged in");

      if (isInWishlist) {
        const { error } = await supabase
          .from("wishlist_items")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("wishlist_items")
          .insert({ user_id: user.id, product_id: productId });
        if (error) throw error;
      }
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ["in-wishlist", productId] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}
