import { useState } from "react";
import { Menu, X, Home, Zap, Tag, Truck, ShoppingCart, Heart, MessageSquare, User, Store, Shield, Settings, Package, ChevronRight, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoleCheck } from "@/hooks/useRoles";
import { useCategories } from "@/hooks/useCategories";
import { useCart } from "@/contexts/CartContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const MobileMenu = () => {
  const [open, setOpen] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { isSeller, isAdmin, isLoading } = useUserRoleCheck();
  const { data: categories = [] } = useCategories();
  const { totalItems } = useCart();

  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden shrink-0">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0 flex flex-col">
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-4">
          {user ? (
            <div>
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center mb-2">
                <User className="w-5 h-5" />
              </div>
              <p className="font-semibold text-sm truncate">{user.email}</p>
            </div>
          ) : (
            <Link to="/auth" onClick={close} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">{t("signIn")}</p>
                <p className="text-xs opacity-80">{t("welcome")}</p>
              </div>
            </Link>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="py-2">
            {/* Main Navigation */}
            <NavItem to="/" icon={Home} label={t("home") || "Home"} onClick={close} />
            <NavItem to="/deals" icon={Zap} label={t("superDeals")} onClick={close} />
            <NavItem to="/deals" icon={Tag} label={t("coupons")} onClick={close} />
            <NavItem to="/search?q=free+shipping" icon={Truck} label={t("freeDelivery")} onClick={close} />
            <NavItem to="/stores" icon={Store} label={t("stores") || "Stores"} onClick={close} />

            <Separator className="my-2" />

            {/* Categories */}
            <button
              onClick={() => setShowCategories(!showCategories)}
              className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
            >
              <span>{t("allCategories")}</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${showCategories ? "rotate-90" : ""}`} />
            </button>
            {showCategories && (
              <div className="bg-muted/50">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.id}`}
                    onClick={close}
                    className="flex items-center gap-3 px-6 py-2.5 text-sm hover:bg-muted transition-colors"
                  >
                    <span>{cat.icon || "📦"}</span>
                    <span>{cat.name}</span>
                  </Link>
                ))}
              </div>
            )}

            <Separator className="my-2" />

            {/* User Links */}
            <NavItem to="/cart" icon={ShoppingCart} label={t("cart")} badge={totalItems > 0 ? totalItems : undefined} onClick={close} />
            <NavItem to="/wishlist" icon={Heart} label={t("wishlist")} onClick={close} />
            <NavItem to="/messages" icon={MessageSquare} label={t("messages")} onClick={close} />

            {user && (
              <>
                <Separator className="my-2" />
                <NavItem to="/account" icon={User} label={t("profileSettings") || "Profile"} onClick={close} />
                <NavItem to="/orders" icon={Package} label={t("myOrders")} onClick={close} />
                <NavItem to="/settings" icon={Settings} label={t("settings")} onClick={close} />

                {!isLoading && isSeller && (
                  <NavItem to="/seller/dashboard" icon={Store} label={t("sellerDashboard")} onClick={close} />
                )}
                {!isLoading && !isSeller && (
                  <NavItem to="/become-seller" icon={Store} label={t("becomeSeller")} onClick={close} />
                )}
                {!isLoading && isAdmin && (
                  <NavItem to="/admin" icon={Shield} label={t("adminDashboard")} onClick={close} className="text-destructive" />
                )}

                <Separator className="my-2" />
                <button
                  onClick={() => { signOut(); close(); }}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-muted transition-colors w-full"
                >
                  <LogOut className="w-5 h-5" />
                  <span>{t("signOut")}</span>
                </button>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

const NavItem = ({
  to,
  icon: Icon,
  label,
  badge,
  onClick,
  className = "",
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
  onClick: () => void;
  className?: string;
}) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center justify-between px-4 py-3 text-sm hover:bg-muted transition-colors ${className}`}
  >
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </div>
    {badge !== undefined && (
      <span className="bg-primary text-primary-foreground text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5">
        {badge > 99 ? "99+" : badge}
      </span>
    )}
  </Link>
);

export default MobileMenu;
