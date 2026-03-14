import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cta_text: string | null;
  cta_link: string | null;
  background_image: string | null;
  background_color: string | null;
  text_color: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type HeroBannerInsert = Omit<HeroBanner, "id" | "created_at" | "updated_at">;

export function useHeroBanners(onlyActive = true) {
  return useQuery({
    queryKey: ["hero-banners", onlyActive],
    staleTime: 15 * 60 * 1000, // 15 min — banners change infrequently
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      let q = supabase
        .from("hero_banners" as any)
        .select("*")
        .order("sort_order", { ascending: true });

      if (onlyActive) {
        q = q.eq("is_active", true);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data as unknown) as HeroBanner[];
    },
  });
}

export function useCreateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (banner: Partial<HeroBannerInsert>) => {
      const { error } = await supabase
        .from("hero_banners" as any)
        .insert(banner as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hero-banners"] }),
  });
}

export function useUpdateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HeroBanner> & { id: string }) => {
      const { error } = await supabase
        .from("hero_banners" as any)
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hero-banners"] }),
  });
}

export function useDeleteBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("hero_banners" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hero-banners"] }),
  });
}
