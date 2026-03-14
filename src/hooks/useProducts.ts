import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProductInsert {
  store_id: string;
  category_id?: string | null;
  title: string;
  description?: string | null;
  price: number;
  original_price?: number | null;
  image?: string | null;
  images?: string[] | null;
  shipping_price?: number | null;
  free_shipping?: boolean | null;
  stock_quantity?: number | null;
}
export interface ProductWithStore {
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
  stock_quantity: number | null;
  created_at: string;
  updated_at: string;
  store: {
    id: string;
    name: string;
    logo: string | null;
    rating: number | null;
    followers: number | null;
    is_verified: boolean | null;
    owner_id?: string | null;
  } | null;
}

export function useProducts(options?: { 
  categoryId?: string; 
  storeId?: string; 
  isChoice?: boolean;
  limit?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ["products", options],
    staleTime: 3 * 60 * 1000, // 3 min
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, store:stores(id, name, logo, rating, followers, is_verified)");

      if (options?.categoryId) {
        query = query.eq("category_id", options.categoryId);
      }
      if (options?.storeId) {
        query = query.eq("store_id", options.storeId);
      }
      if (options?.isChoice) {
        query = query.eq("is_choice", true);
      }
      if (options?.search) {
        query = query.ilike("title", `%${options.search}%`);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown) as ProductWithStore[];
    },
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["product", id],
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("products")
        .select("*, store:stores(id, name, logo, rating, followers, is_verified, description, location, since, positive_feedback, ship_on_time, products_count, owner_id)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown) as ProductWithStore | null;
    },
    enabled: !!id,
  });
}

export function useFlashDeals(limit = 10) {
  return useQuery({
    queryKey: ["flash-deals", limit],
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, store:stores(id, name, logo, rating, followers, is_verified)")
        .not("original_price", "is", null)
        .order("sold", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data as unknown) as ProductWithStore[];
    },
  });
}

export function useChoiceProducts(limit = 12) {
  return useQuery({
    queryKey: ["choice-products", limit],
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, store:stores(id, name, logo, rating, followers, is_verified)")
        .eq("is_choice", true)
        .order("sold", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data as unknown) as ProductWithStore[];
    },
  });
}

export function useCreateProduct() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: ProductInsert) => {
      if (!user) throw new Error("Must be logged in");

      // Verify user owns the store
      const { data: store, error: storeError } = await supabase
        .from("stores")
        .select("id, owner_id")
        .eq("id", productData.store_id)
        .eq("owner_id", user.id)
        .maybeSingle();

      if (storeError) throw storeError;
      if (!store) throw new Error("You don't own this store");

      const { data, error } = await supabase
        .from("products")
        .insert(productData)
        .select("*, store:stores(id, name, logo, rating, followers, is_verified)")
        .single();

      if (error) throw error;
      return data as unknown as ProductWithStore;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["store-products", data.store_id] });
    },
  });
}

export function useUpdateProduct() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...productData }: Partial<ProductInsert> & { id: string }) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", id)
        .select("*, store:stores(id, name, logo, rating, followers, is_verified)")
        .single();

      if (error) throw error;
      return data as unknown as ProductWithStore;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", data.id] });
      queryClient.invalidateQueries({ queryKey: ["store-products", data.store_id] });
    },
  });
}

export function useDeleteProduct() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["store-products"] });
    },
  });
}
