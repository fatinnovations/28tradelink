import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "buyer" | "seller" | "admin";

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

interface SellerApplication {
  id: string;
  user_id: string;
  store_name: string;
  business_description: string | null;
  phone: string | null;
  national_id_url: string | null;
  business_certificate_url: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

// Get current user's roles
export function useUserRoles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data as UserRole[]).map((r) => r.role);
    },
    enabled: !!user,
  });
}

// Check if user has a specific role
export function useHasRole(role: AppRole) {
  const { data: roles = [], isLoading } = useUserRoles();
  return {
    hasRole: roles.includes(role),
    isLoading,
  };
}

// Check multiple roles at once
export function useUserRoleCheck() {
  const { data: roles = [], isLoading } = useUserRoles();

  return {
    roles,
    isLoading,
    isBuyer: roles.includes("buyer"),
    isSeller: roles.includes("seller"),
    isAdmin: roles.includes("admin"),
    hasRole: (role: AppRole) => roles.includes(role),
  };
}

// Get user's primary role (highest privilege)
export function usePrimaryRole() {
  const { data: roles = [], isLoading } = useUserRoles();

  const primaryRole: AppRole | null = roles.includes("admin")
    ? "admin"
    : roles.includes("seller")
    ? "seller"
    : roles.includes("buyer")
    ? "buyer"
    : null;

  return { primaryRole, isLoading };
}

// Get current user's seller application
export function useSellerApplication() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["seller-application", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await (supabase as any)
        .from("seller_applications")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as SellerApplication | null;
    },
    enabled: !!user,
  });
}

// Submit seller application
export function useSubmitSellerApplication() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      storeName,
      businessDescription,
      phone,
      nationalIdUrl,
      businessCertificateUrl,
    }: {
      storeName: string;
      businessDescription?: string;
      phone: string;
      nationalIdUrl: string;
      businessCertificateUrl: string;
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await (supabase as any)
        .from("seller_applications")
        .insert({
          user_id: user.id,
          store_name: storeName,
          business_description: businessDescription,
          phone,
          national_id_url: nationalIdUrl,
          business_certificate_url: businessCertificateUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SellerApplication;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-application"] });
    },
  });
}

// Delete rejected seller application (for resubmission)
export function useDeleteSellerApplication() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicationId: string) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await (supabase as any)
        .from("seller_applications")
        .delete()
        .eq("id", applicationId)
        .eq("user_id", user.id)
        .eq("status", "rejected");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-application"] });
    },
  });
}

// Admin: Get all pending seller applications
export function usePendingApplications() {
  const { hasRole: isAdmin } = useHasRole("admin");

  return useQuery({
    queryKey: ["pending-applications"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("seller_applications")
        .select("*, profiles:seller_applications_user_id_profiles_fkey(full_name, avatar_url)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (SellerApplication & {
        profiles: { full_name: string | null; avatar_url: string | null };
      })[];
    },
    enabled: isAdmin,
  });
}

// Admin: Get all seller applications
export function useAllApplications() {
  const { hasRole: isAdmin } = useHasRole("admin");

  return useQuery({
    queryKey: ["all-applications"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("seller_applications")
        .select("*, profiles:seller_applications_user_id_profiles_fkey(full_name, avatar_url)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (SellerApplication & {
        profiles: { full_name: string | null; avatar_url: string | null };
      })[];
    },
    enabled: isAdmin,
  });
}

// Admin: Approve seller application
export function useApproveApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await (supabase as any).rpc("approve_seller_application", {
        application_id: applicationId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-applications"] });
      queryClient.invalidateQueries({ queryKey: ["all-applications"] });
    },
  });
}

// Admin: Reject seller application
export function useRejectApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ applicationId, reason }: { applicationId: string; reason?: string }) => {
      const { error } = await (supabase as any).rpc("reject_seller_application", {
        application_id: applicationId,
        reason: reason || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-applications"] });
      queryClient.invalidateQueries({ queryKey: ["all-applications"] });
    },
  });
}

// Admin: Get all users with roles
export function useAllUsersWithRoles() {
  const { hasRole: isAdmin } = useHasRole("admin");

  return useQuery({
    queryKey: ["all-users-roles"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("user_roles")
        .select("*, profiles:user_roles_user_id_profiles_fkey(id, full_name, avatar_url)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (UserRole & {
        profiles: { id: string; full_name: string | null; avatar_url: string | null };
      })[];
    },
    enabled: isAdmin,
  });
}

// Admin: Add role to user
export function useAddUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await (supabase as any)
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users-roles"] });
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
    },
  });
}

// Admin: Remove role from user
export function useRemoveUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await (supabase as any)
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users-roles"] });
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
    },
  });
}
