import { Link, useNavigate } from "react-router-dom";
import { Star, Users, Package, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsFollowingStore, useToggleFollowStore, Store } from "@/hooks/useStores";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface StoreCardProps {
  store: Store;
}

const StoreCard = ({ store }: StoreCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isFollowing } = useIsFollowingStore(store.id);
  const toggleFollow = useToggleFollowStore();

  const formatNumber = (num: number | null | undefined) => {
    if (!num) return "0";
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please sign in to follow stores");
      navigate("/auth");
      return;
    }
    
    toggleFollow.mutate(
      { storeId: store.id, isFollowing: !!isFollowing },
      {
        onSuccess: () => {
          toast.success(isFollowing ? `Unfollowed ${store.name}` : `Following ${store.name}`);
        },
      }
    );
  };

  return (
    <Link to={`/store/${store.id}`} className="block">
      <div className="bg-card rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="h-24 relative">
          <img
            src={store.banner || "/placeholder.svg"}
            alt={store.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
        
        <div className="p-4 -mt-8 relative">
          <div className="flex items-end gap-3 mb-3">
            <div className="w-14 h-14 rounded-full border-2 border-card overflow-hidden bg-card">
              <img
                src={store.logo || "/placeholder.svg"}
                alt={store.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 pb-1">
              <h3 className="font-semibold text-foreground truncate">{store.name}</h3>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-star text-star" />
              <span>{store.positive_feedback || store.rating || 0}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{formatNumber(store.followers)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              <span>{store.products_count || 0}</span>
            </div>
          </div>

          <Button
            variant={isFollowing ? "outline" : "default"}
            size="sm"
            className="w-full"
            onClick={handleFollowClick}
            disabled={toggleFollow.isPending}
          >
            <Heart className={`w-4 h-4 mr-1 ${isFollowing ? "fill-primary text-primary" : ""}`} />
            {isFollowing ? "Following" : "Follow"}
          </Button>
        </div>
      </div>
    </Link>
  );
};

export default StoreCard;
