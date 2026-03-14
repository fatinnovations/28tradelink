import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TopBar from "./TopBar";
import SearchBar from "./SearchBar";
import UserNav from "./UserNav";
import MainNav from "./MainNav";
import MobileMenu from "./MobileMenu";

const Header = () => {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 bg-card shadow-sm">
      {/* TopBar - hidden on small screens */}
      <div className="hidden sm:block">
        <TopBar />
      </div>

      <div className="container py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Mobile hamburger */}
          <MobileMenu />

          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm sm:text-lg">28</span>
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-bold text-primary leading-tight">28TradeLink</h1>
              <p className="hidden sm:block text-[10px] text-muted-foreground -mt-0.5">{t("globalMarketplace")}</p>
            </div>
          </Link>

          {/* Search - hidden on xs, shown on sm+ */}
          <div className="hidden sm:flex flex-1">
            <SearchBar />
          </div>

          <UserNav />
        </div>

        {/* Mobile search bar - full width below header row */}
        <div className="sm:hidden mt-2">
          <SearchBar />
        </div>
      </div>

      {/* MainNav - hidden on mobile since we have hamburger */}
      <div className="hidden md:block">
        <MainNav />
      </div>
    </header>
  );
};

export default Header;
