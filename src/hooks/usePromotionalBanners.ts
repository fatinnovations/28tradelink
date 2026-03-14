import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PromotionalBanner {
  id: string;
  title: string;
  message: string | null;
  link_url: string | null;
  link_text: string | null;
  banner_type: "bar" | "popup";
  background_color: string | null;
  text_color: string | null;
  image_url: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_dismissible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type PromotionalBannerInsert = Omit<PromotionalBanner, "id" | "created_at" | "updated_at">;

export function usePromotionalBanners(onlyActive = false) {
  return useQuery({
    queryKey: ["promotional-banners", onlyActive],
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      let q = supabase
        .from("promotional_banners" as any)
        .select("*")
        .order("sort_order", { ascending: true });

      if (onlyActive) {
        const now = new Date().toISOString();
        q = q
          .eq("is_active", true)
          .lte("start_date", now)
          .gte("end_date", now);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data as unknown) as PromotionalBanner[];
    },
  });
}

export function useActivePromos() {
  return usePromotionalBanners(true);
}

export function useCreatePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (promo: Partial<PromotionalBannerInsert>) => {
      const { error } = await supabase
        .from("promotional_banners" as any)
        .insert(promo as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promotional-banners"] }),
  });
}

export function useUpdatePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PromotionalBanner> & { id: string }) => {
      const { error } = await supabase
        .from("promotional_banners" as any)
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promotional-banners"] }),
  });
}

export function useDeletePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("promotional_banners" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promotional-banners"] }),
  });
}
