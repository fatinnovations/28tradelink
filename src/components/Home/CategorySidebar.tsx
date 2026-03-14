import { useCategories } from "@/hooks/useCategories";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

const CategorySidebar = () => {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg shadow-sm overflow-hidden hidden lg:block w-56 shrink-0">
        <div className="max-h-[350px] overflow-y-auto p-2 space-y-1">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!categories?.length) return null;

  return (
    <div className="bg-card rounded-lg shadow-sm overflow-hidden hidden lg:block w-56 shrink-0">
      <div className="max-h-[350px] overflow-y-auto">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/category/${category.id}`}
            className="flex items-center justify-between px-3 py-2.5 hover:bg-muted transition-colors group"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{category.icon || "📦"}</span>
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                {category.name}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategorySidebar;
