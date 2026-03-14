import { Globe, ChevronDown, Smartphone, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrency, CurrencyCode } from "@/contexts/CurrencyContext";
import { useTranslation } from "react-i18next";
import { languages } from "@/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const currencies: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "MWK", label: "Malawi Kwacha", symbol: "MK" },
];

const TopBar = () => {
  const { currency, setCurrency } = useCurrency();
  const { t, i18n } = useTranslation();

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  return (
    <div className="bg-foreground text-background text-xs py-1.5">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">{t("welcome")}</span>
          <Link to="/info/buyer-protection" className="nav-link text-background/80 hover:text-background">
            {t("buyerProtection")}
          </Link>
          <Link to="/info/help-center" className="nav-link text-background/80 hover:text-background">
            {t("helpCenter")}
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/info/download-app" className="flex items-center gap-1 hover:text-background/80">
            <Smartphone className="w-3 h-3" />
            <span className="hidden sm:inline">{t("downloadApp")}</span>
          </Link>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 cursor-pointer hover:text-background/80 outline-none">
              <Globe className="w-3 h-3" />
              <span>{currentLang.nativeLabel}</span>
              <ChevronDown className="w-3 h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span>{lang.nativeLabel}</span>
                  {i18n.language === lang.code && <Check className="w-4 h-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Currency Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 cursor-pointer hover:text-background/80 outline-none">
              <span>{currency}</span>
              <ChevronDown className="w-3 h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              {currencies.map((c) => (
                <DropdownMenuItem
                  key={c.code}
                  onClick={() => setCurrency(c.code)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span>{c.symbol} {c.label}</span>
                  {currency === c.code && <Check className="w-4 h-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
