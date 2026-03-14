import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface StoreInsert {
  name: string;
  description?: string | null;
  logo?: string | null;
  banner?: string | null;
  location?: string | null;
}

export interface Store {
  id: string;
  owner_id: string | null;
  name: string;
  logo: string | null;
  banner: string | null;
  description: string | null;
  rating: number | null;
  followers: number | null;
  products_count: number | null;
  location: string | null;
  since: number | null;
  positive_feedback: number | null;
  ship_on_time: number | null;
  is_verified: boolean | null;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
  store: Store | null;
}

export function useStores(options?: { search?: string; limit?: number }) {
  return useQuery({
    queryKey: ["stores", options],
    staleTime: 10 * 60 * 1000, // 10 min — store list is stable
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      let query = supabase.from("stores").select("*");

      if (options?.search) {
        query = query.ilike("name", `%${options.search}%`);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      query = query.order("followers", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown) as Store[];
    },
  });
}

export function useStore(id: string | undefined) {
  return useQuery({
    queryKey: ["store", id],
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown) as Store | null;
    },
    enabled: !!id,
  });
}

export function useStoreProducts(storeId: string | undefined) {
  return useQuery({
    queryKey: ["store-products", storeId],
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*, store:stores(*)")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown) as ProductWithStore[];
    },
    enabled: !!storeId,
  });
}

export function useFollowedStores() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["followed-stores", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("store_follows")
        .select("*, store:stores(*)")
        .eq("user_id", user.id);
      if (error) throw error;
      return ((data as unknown) as { store: Store }[]).map((f) => f.store);
    },
    enabled: !!user,
  });
}

export function useIsFollowingStore(storeId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-following", storeId, user?.id],
    queryFn: async () => {
      if (!user || !storeId) return false;
      const { data, error } = await supabase
        .from("store_follows")
        .select("id")
        .eq("user_id", user.id)
        .eq("store_id", storeId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!storeId,
  });
}

export function useToggleFollowStore() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId, isFollowing }: { storeId: string; isFollowing: boolean }) => {
      if (!user) throw new Error("Must be logged in");

      if (isFollowing) {
        const { error } = await supabase
          .from("store_follows")
          .delete()
          .eq("user_id", user.id)
          .eq("store_id", storeId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("store_follows")
          .insert({ user_id: user.id, store_id: storeId });
        if (error) throw error;
      }
    },
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: ["is-following", storeId] });
      queryClient.invalidateQueries({ queryKey: ["followed-stores"] });
      queryClient.invalidateQueries({ queryKey: ["store", storeId] });
    },
  });
}

export function useCreateStore() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storeData: StoreInsert) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("stores")
        .insert({
          ...storeData,
          owner_id: user.id,
          since: new Date().getFullYear(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as Store;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}

export function useUpdateStore() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...storeData }: Partial<Store> & { id: string }) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("stores")
        .update(storeData)
        .eq("id", id)
        .eq("owner_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Store;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["store", data.id] });
    },
  });
}
