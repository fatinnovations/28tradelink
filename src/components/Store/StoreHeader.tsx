import { Star, Users, Package, MapPin, Clock, Truck, MessageSquare, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsFollowingStore, useToggleFollowStore, Store } from "@/hooks/useStores";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface StoreHeaderProps {
  store: Store;
}

const StoreHeader = ({ store }: StoreHeaderProps) => {
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

  const handleFollow = () => {
    if (!user) {
      toast.error("Please sign in to follow stores");
      navigate("/auth");
      return;
    }
    
    toggleFollow.mutate(
      { storeId: store.id, isFollowing: !!isFollowing },
      {
        onSuccess: () => {
          toast.success(isFollowing ? `Unfollowed ${store.name}` : `Now following ${store.name}!`);
        },
      }
    );
  };

  return (
    <div className="bg-card rounded-lg shadow-sm overflow-hidden">
      {/* Banner */}
      <div className="h-48 md:h-64 relative">
        <img
          src={store.banner || "/placeholder.svg"}
          alt={store.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      {/* Store Info */}
      <div className="p-4 md:p-6 -mt-16 relative">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Avatar */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-card overflow-hidden bg-card shadow-lg">
            <img
              src={store.logo || "/placeholder.svg"}
              alt={store.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {store.name}
            </h1>
            <p className="text-muted-foreground mb-3 max-w-2xl">
              {store.description || "Quality products at great prices"}
            </p>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              {store.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{store.location}</span>
                </div>
              )}
              {store.since && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Est. {store.since}</span>
                </div>
              )}
              {store.ship_on_time && (
                <div className="flex items-center gap-1">
                  <Truck className="w-4 h-4" />
                  <span>{store.ship_on_time}% on-time</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!user) {
                  toast.error("Please sign in to chat with seller");
                  navigate("/auth");
                  return;
                }
                if (store.owner_id) {
                  navigate(`/messages?storeId=${store.id}&sellerId=${store.owner_id}`);
                }
              }}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Chat with Seller
            </Button>
            <Button
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              onClick={handleFollow}
              disabled={toggleFollow.isPending}
            >
              <Heart className={`w-4 h-4 mr-1 ${isFollowing ? "fill-primary text-primary" : ""}`} />
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-5 h-5 fill-star text-star" />
              <span className="text-xl font-bold text-foreground">{store.positive_feedback || store.rating || 0}%</span>
            </div>
            <p className="text-sm text-muted-foreground">Positive Rating</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-xl font-bold text-foreground">{formatNumber(store.followers)}</span>
            </div>
            <p className="text-sm text-muted-foreground">Followers</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Package className="w-5 h-5 text-primary" />
              <span className="text-xl font-bold text-foreground">{store.products_count || 0}</span>
            </div>
            <p className="text-sm text-muted-foreground">Products</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-xl font-bold text-foreground">&lt; 24h</span>
            </div>
            <p className="text-sm text-muted-foreground">Response Time</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreHeader;
