import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
  created_at: string;
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    staleTime: 30 * 60 * 1000, // 30 min — categories rarely change
    gcTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .is("parent_id", null)
        .order("name");
      if (error) throw error;
      return (data as unknown) as Category[];
    },
  });
}

export function useSubcategories(parentId: string | undefined) {
  return useQuery({
    queryKey: ["subcategories", parentId],
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    queryFn: async () => {
      if (!parentId) return [];
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("parent_id", parentId)
        .order("name");
      if (error) throw error;
      return (data as unknown) as Category[];
    },
    enabled: !!parentId,
  });
}

export function useCategory(id: string | undefined) {
  return useQuery({
    queryKey: ["category", id],
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown) as Category | null;
    },
    enabled: !!id,
  });
}
