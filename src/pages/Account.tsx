import { User, Package, Heart, MapPin, Settings, LogOut } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useOrders } from "@/hooks/useOrders";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

const Account = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { format: formatCurrency } = useCurrency();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out", description: "You have been signed out successfully." });
    navigate("/");
  };

  const userName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  const menuItems = [
    { icon: Package, label: "My Orders", to: "/orders" },
    { icon: Heart, label: "Wishlist", to: "/wishlist" },
    { icon: MapPin, label: "Addresses", to: "/settings" },
    { icon: Settings, label: "Settings", to: "/settings" },
  ];

  const recentOrders = orders.slice(0, 3);

  const statusColors: Record<string, string> = {
    pending: "bg-warning/20 text-warning",
    confirmed: "bg-primary/20 text-primary",
    processing: "bg-primary/20 text-primary",
    shipped: "bg-accent/20 text-accent-foreground",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-destructive/20 text-destructive",
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">{userName.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="font-medium">{userName}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <Link key={item.label} to={item.to} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                ))}
                <button onClick={handleSignOut} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors w-full text-left text-destructive">
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm">Sign Out</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-card rounded-lg shadow-sm">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-bold">Recent Orders</h2>
                <Link to="/orders" className="text-sm text-primary hover:underline">View All</Link>
              </div>
              {ordersLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : recentOrders.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No orders yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium font-mono text-sm">#{order.id.slice(0, 8).toUpperCase()}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColors[order.status || "pending"] || statusColors.pending}`}>
                            {(order.status || "pending").replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(order.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(order.total)}</p>
                        <Link to="/orders" className="text-sm text-primary hover:underline">Details</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card rounded-lg shadow-sm p-4">
              <h2 className="font-bold mb-4">Recommended For You</h2>
              <div className="text-center py-8 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Personalized recommendations coming soon!</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Account;
