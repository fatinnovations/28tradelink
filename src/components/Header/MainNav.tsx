import { Menu, ChevronDown, Zap, Tag, Truck } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MainNav = () => {
  const { data: categories } = useCategories();
  const { t } = useTranslation();

  return (
    <nav className="bg-card border-b">
      <div className="container flex items-center gap-6 py-2 overflow-x-auto scrollbar-hide">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 font-medium hover:text-primary transition-colors whitespace-nowrap outline-none">
            <Menu className="w-5 h-5" />
            <span>{t("allCategories")}</span>
            <ChevronDown className="w-4 h-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 max-h-[70vh] overflow-y-auto">
            {(categories || []).map((category) => (
              <DropdownMenuItem key={category.id} asChild>
                <Link
                  to={`/category/${category.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
                >
                  <span className="text-lg">{category.icon || "📦"}</span>
                  <span className="text-sm">{category.name}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Link to="/deals" className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
          <Zap className="w-4 h-4 text-secondary" />
          <span>{t("superDeals")}</span>
        </Link>

        <Link to="/deals" className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
          <Tag className="w-4 h-4 text-primary" />
          <span>{t("coupons")}</span>
        </Link>

        <Link to="/search?q=free+shipping" className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
          <Truck className="w-4 h-4 text-shipping" />
          <span>{t("freeDelivery")}</span>
        </Link>

        <Link to="/search?q=choice" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
          {t("choice")}
        </Link>

        <Link to="/deals" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
          {t("plus")}
        </Link>

        <Link to="/deals" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
          {t("newUserZone")}
        </Link>
      </div>
    </nav>
  );
};

export default MainNav;
