import { User, ShoppingCart, Heart, MessageSquare, Store, Shield } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoleCheck } from "@/hooks/useRoles";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConversations } from "@/hooks/useMessages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const UserNav = () => {
  const { totalItems } = useCart();
  const { user, signOut } = useAuth();
  const { isSeller, isAdmin, isLoading } = useUserRoleCheck();
  const { t } = useTranslation();
  const { data: conversations = [] } = useConversations();
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="flex items-center gap-1 sm:gap-3">
      {/* Account - hidden on mobile (available in hamburger) */}
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hidden sm:flex flex-col items-center p-2 hover:text-primary transition-colors group">
              <User className="w-5 h-5" />
              <span className="text-xs hidden lg:block group-hover:text-primary">
                {t("account")}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t("myAccount")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/account">{t("profileSettings")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/orders">{t("myOrders")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">{t("settings")}</Link>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {!isLoading && isSeller && (
              <DropdownMenuItem asChild>
                <Link to="/seller/dashboard" className="flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  {t("sellerDashboard")}
                </Link>
              </DropdownMenuItem>
            )}
            
            {!isLoading && !isSeller && (
              <DropdownMenuItem asChild>
                <Link to="/become-seller" className="flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  {t("becomeSeller")}
                </Link>
              </DropdownMenuItem>
            )}
            
            {!isLoading && isAdmin && (
              <DropdownMenuItem asChild>
                <Link to="/admin" className="flex items-center gap-2 text-destructive">
                  <Shield className="w-4 h-4" />
                  {t("adminDashboard")}
                </Link>
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
              {t("signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link 
          to="/auth" 
          className="hidden sm:flex flex-col items-center p-2 hover:text-primary transition-colors group"
        >
          <User className="w-5 h-5" />
          <span className="text-xs hidden lg:block group-hover:text-primary">
            {t("signIn")}
          </span>
        </Link>
      )}
      
      {/* Wishlist - icon only on mobile */}
      <Link to="/wishlist" className="flex flex-col items-center p-1.5 sm:p-2 hover:text-primary transition-colors group">
        <Heart className="w-5 h-5" />
        <span className="text-xs hidden lg:block group-hover:text-primary">{t("wishlist")}</span>
      </Link>
      
      {/* Messages */}
      <Link to="/messages" className="flex flex-col items-center p-1.5 sm:p-2 hover:text-primary transition-colors group relative">
        <MessageSquare className="w-5 h-5" />
        <span className="text-xs hidden lg:block group-hover:text-primary">{t("messages")}</span>
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-primary text-primary-foreground text-[10px] min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </Link>
      
      {/* Cart */}
      <Link to="/cart" className="flex flex-col items-center p-1.5 sm:p-2 hover:text-primary transition-colors group relative">
        <ShoppingCart className="w-5 h-5" />
        <span className="text-xs hidden lg:block group-hover:text-primary">{t("cart")}</span>
        {totalItems > 0 && (
          <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-primary text-primary-foreground text-[10px] min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </Link>
    </div>
  );
};

export default UserNav;
