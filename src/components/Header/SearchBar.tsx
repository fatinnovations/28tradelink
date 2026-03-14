import { useState } from "react";
import { Search, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const suggestions = [
    "wireless earbuds",
    "phone case",
    "smart watch",
    "laptop stand",
    "LED lights",
  ];

  const handleSearch = (query?: string) => {
    const q = (query || searchQuery).trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setIsFocused(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex-1 max-w-2xl mx-4 relative">
      <div className={`flex items-center border-2 rounded-full overflow-hidden transition-all ${isFocused ? 'border-primary ring-2 ring-primary/20' : 'border-primary'}`}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={t("searchPlaceholder")}
          className="flex-1 px-4 py-2 outline-none text-sm bg-transparent"
        />
        <button className="p-2 hover:bg-muted transition-colors">
          <Camera className="w-5 h-5 text-muted-foreground" />
        </button>
        <Button className="rounded-none rounded-r-full px-6 h-full" onClick={() => handleSearch()}>
          <Search className="w-5 h-5" />
        </Button>
      </div>

      {isFocused && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card rounded-lg shadow-lg border z-50">
          <div className="p-3">
            <p className="text-xs text-muted-foreground mb-2">{t("popularSearches")}</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  className="px-3 py-1 bg-muted rounded-full text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSearch(suggestion);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
