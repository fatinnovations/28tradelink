import { Home, Grid3X3, ShoppingCart, MessageSquare, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCart } from "@/contexts/CartContext";
import { useConversations } from "@/hooks/useMessages";
import { cn } from "@/lib/utils";

const MobileBottomNav = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { totalItems } = useCart();
  const { data: conversations = [] } = useConversations();
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const items = [
    { to: "/", icon: Home, label: t("home") || "Home" },
    { to: "/category/all", icon: Grid3X3, label: t("allCategories") || "Categories" },
    { to: "/cart", icon: ShoppingCart, label: t("cart") || "Cart", badge: totalItems },
    { to: "/messages", icon: MessageSquare, label: t("messages") || "Messages", badge: totalUnread },
    { to: "/account", icon: User, label: t("account") || "Account" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around h-14">
        {items.map(({ to, icon: Icon, label, badge }) => {
          const isActive = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[10px] transition-colors relative",
                isActive ? "text-primary font-semibold" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {badge !== undefined && badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-primary text-primary-foreground text-[9px] min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
              <span className="truncate max-w-[56px]">{label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area spacer for notched phones */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};

export default MobileBottomNav;
