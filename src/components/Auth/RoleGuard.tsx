import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoleCheck, AppRole } from "@/hooks/useRoles";
import { Loader2 } from "lucide-react";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  fallback?: ReactNode;
  redirectTo?: string;
}

export const RoleGuard = ({
  children,
  allowedRoles,
  fallback,
  redirectTo = "/",
}: RoleGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { roles, isLoading: rolesLoading } = useUserRoleCheck();

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const hasAllowedRole = allowedRoles.some((role) => roles.includes(role));

  if (!hasAllowedRole) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

// Convenience components for common role checks
export const AdminOnly = ({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) => (
  <RoleGuard allowedRoles={["admin"]} fallback={fallback} redirectTo="/">
    {children}
  </RoleGuard>
);

export const SellerOnly = ({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) => (
  <RoleGuard allowedRoles={["seller", "admin"]} fallback={fallback} redirectTo="/">
    {children}
  </RoleGuard>
);

export const BuyerOnly = ({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) => (
  <RoleGuard allowedRoles={["buyer", "seller", "admin"]} fallback={fallback}>
    {children}
  </RoleGuard>
);
