import { useState } from "react";
import { Link } from "react-router-dom";
import AdminBannerManager from "@/components/Admin/AdminBannerManager";
import AdminPromoManager from "@/components/Admin/AdminPromoManager";
import { Image as ImageIcon, Megaphone } from "lucide-react";
import {
  Users,
  Store,
  Package,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  LayoutDashboard,
  FileText,
  Eye,
  BadgeCheck,
  BadgeX,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  BarChart3,
  ShieldCheck,
  ShieldOff,
  ShoppingCart,
  Trash2,
  Menu,
} from "lucide-react";
import { AdminOnly } from "@/components/Auth/RoleGuard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  usePendingApplications,
  useAllApplications,
  useApproveApplication,
  useRejectApplication,
  useAllUsersWithRoles,
  AppRole,
} from "@/hooks/useRoles";
import { useProducts } from "@/hooks/useProducts";
import { useStores } from "@/hooks/useStores";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import type { Json } from "@/integrations/supabase/types";

type AdminView = "overview" | "applications" | "users" | "stores" | "orders" | "banners" | "promos";

interface AdminOrder {
  id: string;
  user_id: string;
  status: string | null;
  subtotal: number;
  shipping_cost: number | null;
  tax: number | null;
  total: number;
  shipping_address: Json;
  payment_method: Json;
  tracking_number: string | null;
  estimated_delivery: string | null;
  created_at: string;
  updated_at: string;
}

function useAdminOrders() {
  return useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown) as AdminOrder[];
    },
  });
}

function useAdminOrderItems(orderId: string | null) {
  return useQuery({
    queryKey: ["admin-order-items", orderId],
    queryFn: async () => {
      if (!orderId) return [];
      const { data, error } = await supabase
        .from("order_items")
        .select("*, product:products(id, title, image, price)")
        .eq("order_id", orderId);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!orderId,
  });
}

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState<AdminView>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [applicationFilter, setApplicationFilter] = useState<string>("all");
  const [applicationSearch, setApplicationSearch] = useState("");
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyingStore, setVerifyingStore] = useState<{ id: string; name: string; verified: boolean } | null>(null);
  const [deleteStoreDialog, setDeleteStoreDialog] = useState(false);
  const [deletingStore, setDeletingStore] = useState<{ id: string; name: string } | null>(null);
  const [orderFilter, setOrderFilter] = useState<string>("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updateStatusDialog, setUpdateStatusDialog] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<{ id: string; status: string } | null>(null);
  const [newStatus, setNewStatus] = useState("");

  const { data: pendingApplications = [] } = usePendingApplications();
  const { data: allApplications = [] } = useAllApplications();
  const { data: usersWithRoles = [] } = useAllUsersWithRoles();
  const { data: products = [] } = useProducts();
  const { data: stores = [] } = useStores();
  const { data: allOrders = [] } = useAdminOrders();
  const { data: expandedOrderItems = [] } = useAdminOrderItems(expandedOrder);

  const approveApplication = useApproveApplication();
  const rejectApplication = useRejectApplication();
  const queryClient = useQueryClient();

  const handleApprove = async (id: string) => {
    try {
      await approveApplication.mutateAsync(id);
      toast.success("Application approved! Seller role granted.");
    } catch {
      toast.error("Failed to approve application");
    }
  };

  const openRejectDialog = (id: string) => {
    setRejectingAppId(id);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectingAppId) return;
    try {
      await rejectApplication.mutateAsync({
        applicationId: rejectingAppId,
        reason: rejectionReason.trim() || undefined,
      });
      toast.success("Application rejected");
      setRejectDialogOpen(false);
    } catch {
      toast.error("Failed to reject application");
    }
  };

  const handleToggleVerify = async () => {
    if (!verifyingStore) return;
    try {
      const { error } = await (supabase as any)
        .from("stores")
        .update({ is_verified: !verifyingStore.verified })
        .eq("id", verifyingStore.id);
      if (error) throw error;
      toast.success(
        verifyingStore.verified
          ? `${verifyingStore.name} has been unverified`
          : `${verifyingStore.name} has been verified!`
      );
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      setVerifyDialogOpen(false);
    } catch {
      toast.error("Failed to update store verification");
    }
  };

  const handleDeleteStore = async () => {
    if (!deletingStore) return;
    try {
      const { error } = await supabase
        .from("stores")
        .delete()
        .eq("id", deletingStore.id);
      if (error) throw error;
      toast.success(`"${deletingStore.name}" has been deleted`);
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      setDeleteStoreDialog(false);
    } catch {
      toast.error("Failed to delete store. It may have products or orders linked to it.");
    }
  };

  const handleUpdateOrderStatus = async () => {
    if (!updatingOrder || !newStatus) return;
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", updatingOrder.id);
      if (error) throw error;
      toast.success(`Order status updated to "${newStatus}"`);
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setUpdateStatusDialog(false);
    } catch {
      toast.error("Failed to update order status");
    }
  };

  const roleStats = {
    buyers: usersWithRoles.filter((u) => u.role === "buyer").length,
    sellers: usersWithRoles.filter((u) => u.role === "seller").length,
    admins: usersWithRoles.filter((u) => u.role === "admin").length,
  };

  const filteredApplications = allApplications.filter((app) => {
    const matchesFilter = applicationFilter === "all" || app.status === applicationFilter;
    const matchesSearch =
      !applicationSearch ||
      app.store_name.toLowerCase().includes(applicationSearch.toLowerCase()) ||
      app.profiles?.full_name?.toLowerCase().includes(applicationSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredOrders = allOrders.filter((order) => {
    const matchesFilter = orderFilter === "all" || order.status === orderFilter;
    const matchesSearch =
      !orderSearch ||
      order.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.tracking_number?.toLowerCase().includes(orderSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const orderStats = {
    total: allOrders.length,
    pending: allOrders.filter((o) => o.status === "pending").length,
    processing: allOrders.filter((o) => o.status === "processing").length,
    shipped: allOrders.filter((o) => ["shipped", "in_transit"].includes(o.status || "")).length,
    delivered: allOrders.filter((o) => o.status === "delivered").length,
    totalRevenue: allOrders.reduce((sum, o) => sum + o.total, 0),
  };

  const sidebarItems = [
    { id: "overview" as AdminView, label: "Overview", icon: LayoutDashboard },
    {
      id: "applications" as AdminView,
      label: "Applications",
      icon: FileText,
      badge: pendingApplications.length > 0 ? pendingApplications.length : undefined,
    },
    {
      id: "orders" as AdminView,
      label: "Orders",
      icon: ShoppingCart,
      badge: orderStats.pending > 0 ? orderStats.pending : undefined,
    },
    { id: "users" as AdminView, label: "Users & Roles", icon: Users },
    { id: "stores" as AdminView, label: "Stores", icon: Store },
    { id: "banners" as AdminView, label: "Banners", icon: ImageIcon },
    { id: "promos" as AdminView, label: "Promotions", icon: Megaphone },
  ];

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case "admin": return "destructive";
      case "seller": return "default";
      case "buyer": return "secondary";
      default: return "outline";
    }
  };

  const getOrderStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-warning border-warning/30 bg-warning/5"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "confirmed":
      case "processing":
        return <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5"><Package className="w-3 h-3 mr-1" />Processing</Badge>;
      case "shipped":
      case "in_transit":
        return <Badge variant="outline" className="text-secondary border-secondary/30 bg-secondary/5"><ShoppingCart className="w-3 h-3 mr-1" />Shipped</Badge>;
      case "delivered":
        return <Badge className="bg-success/10 text-success border-success/30" variant="outline"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  const handleNavClick = (view: AdminView) => {
    setActiveView(view);
    setSidebarOpen(false);
  };

  const SidebarContent = () => (
    <>
      <div className="p-4 md:p-6 border-b">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to store</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">Manage platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeView === item.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeView === item.id
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-destructive text-destructive-foreground"
              }`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground">
          <p>{roleStats.buyers + roleStats.sellers + roleStats.admins} total roles</p>
          <p>{stores.length} stores · {products.length} products</p>
          <p>{allOrders.length} orders</p>
        </div>
      </div>
    </>
  );

  return (
    <AdminOnly>
      <div className="min-h-screen bg-muted/30 flex flex-col md:flex-row">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-40 bg-card border-b px-4 py-3 flex items-center gap-3">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 min-w-0">
            <Shield className="w-5 h-5 text-primary shrink-0" />
            <span className="font-bold text-foreground truncate">
              {sidebarItems.find(i => i.id === activeView)?.label || "Admin"}
            </span>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 border-r bg-card min-h-screen sticky top-0 flex-col">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {/* Overview */}
          {activeView === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground">Dashboard Overview</h2>
                <p className="text-sm text-muted-foreground">Platform statistics at a glance</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                <Card className="border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6 md:pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                    <div className="text-2xl md:text-3xl font-bold text-foreground">{roleStats.buyers + roleStats.sellers}</div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">{roleStats.buyers} buyers · {roleStats.sellers} sellers</p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6 md:pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Stores</CardTitle>
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <Store className="h-3.5 w-3.5 md:h-4 md:w-4 text-secondary" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                    <div className="text-2xl md:text-3xl font-bold text-foreground">{stores.length}</div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                      {stores.filter((s) => s.is_verified).length} verified
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6 md:pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Products</CardTitle>
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                    <div className="text-2xl md:text-3xl font-bold text-foreground">{products.length}</div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">across all stores</p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6 md:pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Orders</CardTitle>
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <ShoppingCart className="h-3.5 w-3.5 md:h-4 md:w-4 text-secondary" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                    <div className="text-2xl md:text-3xl font-bold text-foreground">{orderStats.total}</div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">${orderStats.totalRevenue.toFixed(2)} revenue</p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm col-span-2 md:col-span-1 border-l-4 border-l-warning">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6 md:pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Pending</CardTitle>
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-warning" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                    <div className="text-2xl md:text-3xl font-bold text-warning">{pendingApplications.length}</div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">applications awaiting review</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              {pendingApplications.length > 0 && (
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Requires Attention</CardTitle>
                    <CardDescription>Pending seller applications need review</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {pendingApplications.slice(0, 3).map((app) => (
                      <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={app.profiles?.avatar_url || ""} />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {app.profiles?.full_name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground">{app.store_name}</p>
                            <p className="text-xs text-muted-foreground">by {app.profiles?.full_name || "Unknown"}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-12 sm:ml-0">
                          <Button size="sm" onClick={() => handleApprove(app.id)} disabled={approveApplication.isPending}>
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openRejectDialog(app.id)}>
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                    {pendingApplications.length > 3 && (
                      <Button variant="ghost" className="w-full" onClick={() => setActiveView("applications")}>
                        View all {pendingApplications.length} pending applications
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <Card className="border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveView("applications")}>
                  <CardContent className="flex items-center gap-3 md:gap-4 p-4 md:p-6">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-foreground">{allApplications.length}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Applications</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveView("orders")}>
                  <CardContent className="flex items-center gap-3 md:gap-4 p-4 md:p-6">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-foreground">{orderStats.pending}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Pending Orders</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveView("users")}>
                  <CardContent className="flex items-center gap-3 md:gap-4 p-4 md:p-6">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                      <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-foreground">{roleStats.admins}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Admin Users</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveView("stores")}>
                  <CardContent className="flex items-center gap-3 md:gap-4 p-4 md:p-6">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-foreground">{stores.filter((s) => s.is_verified).length}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Verified Stores</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Applications View */}
          {activeView === "applications" && (
            <div className="space-y-4 md:space-y-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground">Seller Applications</h2>
                <p className="text-sm text-muted-foreground">Review, approve, or reject seller applications</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by store name or applicant..."
                    value={applicationSearch}
                    onChange={(e) => setApplicationSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={applicationFilter} onValueChange={setApplicationFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredApplications.length === 0 ? (
                <Card className="border-none shadow-sm">
                  <CardContent className="py-16 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No applications match your filters</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredApplications.map((app) => {
                    const isExpanded = expandedApp === app.id;
                    return (
                      <Card key={app.id} className="border-none shadow-sm overflow-hidden">
                        <div
                          className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() => setExpandedApp(isExpanded ? null : app.id)}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarImage src={app.profiles?.avatar_url || ""} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {app.profiles?.full_name?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-foreground truncate">{app.store_name}</p>
                                {app.status === "pending" && (
                                  <Badge variant="outline" className="text-warning border-warning/30 bg-warning/5 shrink-0">
                                    <Clock className="w-3 h-3 mr-1" /> Pending
                                  </Badge>
                                )}
                                {app.status === "approved" && (
                                  <Badge className="bg-success/10 text-success border-success/30 shrink-0" variant="outline">
                                    <CheckCircle className="w-3 h-3 mr-1" /> Approved
                                  </Badge>
                                )}
                                {app.status === "rejected" && (
                                  <Badge variant="destructive" className="shrink-0">
                                    <XCircle className="w-3 h-3 mr-1" /> Rejected
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                by {app.profiles?.full_name || "Unknown"} · {new Date(app.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-[52px] sm:ml-0">
                            {app.status === "pending" && (
                              <>
                                <Button size="sm" onClick={(e) => { e.stopPropagation(); handleApprove(app.id); }} disabled={approveApplication.isPending}>
                                  <BadgeCheck className="w-3.5 h-3.5 mr-1" /> Approve
                                </Button>
                                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openRejectDialog(app.id); }}>
                                  <BadgeX className="w-3.5 h-3.5 mr-1" /> Reject
                                </Button>
                              </>
                            )}
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="border-t bg-muted/20 p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Store Name</Label>
                                <p className="text-sm font-medium text-foreground mt-1">{app.store_name}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Applicant</Label>
                                <p className="text-sm font-medium text-foreground mt-1">{app.profiles?.full_name || "Unknown"}</p>
                              </div>
                              {(app as any).phone && (
                                <div>
                                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Phone Number</Label>
                                  <p className="text-sm text-foreground mt-1">{(app as any).phone}</p>
                                </div>
                              )}
                              <div className="md:col-span-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Business Description</Label>
                                <p className="text-sm text-foreground mt-1">{app.business_description || "No description provided"}</p>
                              </div>
                              {(app as any).national_id_url && (
                                <div>
                                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">National ID</Label>
                                  <a href={(app as any).national_id_url} target="_blank" rel="noopener noreferrer" className="block mt-1">
                                    <img src={(app as any).national_id_url} alt="National ID" className="w-48 h-32 object-cover rounded-lg border border-border hover:opacity-80 transition-opacity" />
                                  </a>
                                </div>
                              )}
                              {(app as any).business_certificate_url && (
                                <div>
                                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Business Certificate</Label>
                                  <a href={(app as any).business_certificate_url} target="_blank" rel="noopener noreferrer" className="block mt-1">
                                    <img src={(app as any).business_certificate_url} alt="Business Certificate" className="w-48 h-32 object-cover rounded-lg border border-border hover:opacity-80 transition-opacity" />
                                  </a>
                                </div>
                              )}
                              <div>
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Applied On</Label>
                                <p className="text-sm text-foreground mt-1">{new Date(app.created_at).toLocaleString()}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Status</Label>
                                <p className="text-sm text-foreground mt-1 capitalize">{app.status}</p>
                              </div>
                              {app.reviewed_at && (
                                <div>
                                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Reviewed At</Label>
                                  <p className="text-sm text-foreground mt-1">{new Date(app.reviewed_at).toLocaleString()}</p>
                                </div>
                              )}
                              {app.rejection_reason && (
                                <div className="md:col-span-2">
                                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Rejection Reason</Label>
                                  <p className="text-sm text-destructive mt-1">{app.rejection_reason}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Orders View */}
          {activeView === "orders" && (
            <div className="space-y-4 md:space-y-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground">Order Management</h2>
                <p className="text-sm text-muted-foreground">View and manage all orders across the platform</p>
              </div>

              {/* Order Stats */}
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
                <Card className="border-none shadow-sm">
                  <CardContent className="p-3 md:p-4 text-center">
                    <p className="text-lg md:text-2xl font-bold text-foreground">{orderStats.total}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Total</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                  <CardContent className="p-3 md:p-4 text-center">
                    <p className="text-lg md:text-2xl font-bold text-warning">{orderStats.pending}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Pending</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                  <CardContent className="p-3 md:p-4 text-center">
                    <p className="text-lg md:text-2xl font-bold text-primary">{orderStats.processing}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Processing</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm hidden md:block">
                  <CardContent className="p-3 md:p-4 text-center">
                    <p className="text-lg md:text-2xl font-bold text-secondary">{orderStats.shipped}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Shipped</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm hidden md:block">
                  <CardContent className="p-3 md:p-4 text-center">
                    <p className="text-lg md:text-2xl font-bold text-foreground">{orderStats.delivered}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Delivered</p>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by order ID or tracking..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={orderFilter} onValueChange={setOrderFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Orders - Card layout on mobile, table on desktop */}
              {filteredOrders.length === 0 ? (
                <Card className="border-none shadow-sm">
                  <CardContent className="py-16 text-center">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No orders match your filters</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Mobile: Card layout */}
                  <div className="md:hidden space-y-3">
                    {filteredOrders.map((order) => (
                      <Card key={order.id} className="border-none shadow-sm">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-muted-foreground">{order.id.slice(0, 8)}...</span>
                            {getOrderStatusBadge(order.status)}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                            <span className="font-semibold">${order.total.toFixed(2)}</span>
                          </div>
                          {order.tracking_number && (
                            <p className="text-xs text-muted-foreground">Tracking: {order.tracking_number}</p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setUpdatingOrder({ id: order.id, status: order.status || "pending" });
                                setNewStatus(order.status || "pending");
                                setUpdateStatusDialog(true);
                              }}
                            >
                              Update Status
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            >
                              {expandedOrder === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          </div>
                          {expandedOrder === order.id && (
                            <div className="border-t pt-3 space-y-3">
                              <div>
                                <Label className="text-xs text-muted-foreground uppercase">Shipping</Label>
                                <div className="text-sm mt-1">
                                  {(() => {
                                    const addr = order.shipping_address as any;
                                    if (!addr) return "N/A";
                                    return <p>{addr.full_name || addr.fullName}, {addr.city}, {addr.country}</p>;
                                  })()}
                                </div>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Subtotal</span>
                                  <span>${order.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Shipping</span>
                                  <span>${(order.shipping_cost || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-semibold border-t pt-1">
                                  <span>Total</span>
                                  <span>${order.total.toFixed(2)}</span>
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground uppercase">Items</Label>
                                <div className="mt-1 space-y-2">
                                  {expandedOrderItems.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Loading...</p>
                                  ) : (
                                    expandedOrderItems.map((item: any) => (
                                      <div key={item.id} className="flex items-center gap-2">
                                        {item.product?.image && (
                                          <img src={item.product.image} alt="" className="w-8 h-8 rounded object-cover" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm truncate">{item.product?.title || "Unknown"}</p>
                                          <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop: Table layout */}
                  <Card className="border-none shadow-sm hidden md:block">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead>Order ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Tracking</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrders.map((order) => (
                            <>
                              <TableRow
                                key={order.id}
                                className="cursor-pointer"
                                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                              >
                                <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                                <TableCell className="font-semibold">${order.total.toFixed(2)}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {order.tracking_number || "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setUpdatingOrder({ id: order.id, status: order.status || "pending" });
                                        setNewStatus(order.status || "pending");
                                        setUpdateStatusDialog(true);
                                      }}
                                    >
                                      Update Status
                                    </Button>
                                    {expandedOrder === order.id ? (
                                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                              {expandedOrder === order.id && (
                                <TableRow key={`${order.id}-details`}>
                                  <TableCell colSpan={6} className="bg-muted/20 p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div>
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Shipping Address</Label>
                                        <div className="text-sm mt-1 text-foreground">
                                          {(() => {
                                            const addr = order.shipping_address as any;
                                            if (!addr) return "N/A";
                                            return (
                                              <div>
                                                <p>{addr.full_name || addr.fullName}</p>
                                                <p>{addr.address}</p>
                                                <p>{addr.city}, {addr.state} {addr.zip_code || addr.zipCode}</p>
                                                <p>{addr.country}</p>
                                                <p className="text-muted-foreground">{addr.phone}</p>
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Payment</Label>
                                        <div className="text-sm mt-1 text-foreground">
                                          {(() => {
                                            const pay = order.payment_method as any;
                                            if (!pay) return "N/A";
                                            return <p className="capitalize">{pay.type} {pay.last4 ? `····${pay.last4}` : ""}</p>;
                                          })()}
                                        </div>
                                        <div className="mt-2 space-y-1 text-sm">
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span className="text-foreground">${order.subtotal.toFixed(2)}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Shipping</span>
                                            <span className="text-foreground">${(order.shipping_cost || 0).toFixed(2)}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Tax</span>
                                            <span className="text-foreground">${(order.tax || 0).toFixed(2)}</span>
                                          </div>
                                          <Separator />
                                          <div className="flex justify-between font-semibold">
                                            <span>Total</span>
                                            <span>${order.total.toFixed(2)}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Items</Label>
                                        <div className="mt-1 space-y-2">
                                          {expandedOrderItems.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">Loading items...</p>
                                          ) : (
                                            expandedOrderItems.map((item: any) => (
                                              <div key={item.id} className="flex items-center gap-2">
                                                {item.product?.image && (
                                                  <img src={item.product.image} alt="" className="w-8 h-8 rounded object-cover" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-sm text-foreground truncate">{item.product?.title || "Unknown Product"}</p>
                                                  <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                                                </div>
                                              </div>
                                            ))
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Users View */}
          {activeView === "users" && (
            <div className="space-y-4 md:space-y-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground">Users & Roles</h2>
                <p className="text-sm text-muted-foreground">View all registered users and their assigned roles</p>
              </div>

              <div className="grid grid-cols-3 gap-2 md:gap-4">
                <Card className="border-none shadow-sm">
                  <CardContent className="flex items-center gap-2 md:gap-3 p-3 md:p-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 md:w-5 md:h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-lg md:text-2xl font-bold text-foreground">{roleStats.buyers}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Buyers</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                  <CardContent className="flex items-center gap-2 md:gap-3 p-3 md:p-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Store className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg md:text-2xl font-bold text-foreground">{roleStats.sellers}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Sellers</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                  <CardContent className="flex items-center gap-2 md:gap-3 p-3 md:p-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 md:w-5 md:h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-lg md:text-2xl font-bold text-foreground">{roleStats.admins}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Admins</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Mobile: Card layout for users */}
              <div className="md:hidden space-y-2">
                {usersWithRoles.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No users found</p>
                ) : (
                  usersWithRoles.map((userRole) => (
                    <Card key={userRole.id} className="border-none shadow-sm">
                      <CardContent className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={userRole.profiles?.avatar_url || ""} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {userRole.profiles?.full_name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{userRole.profiles?.full_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{new Date(userRole.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Badge variant={getRoleBadgeVariant(userRole.role)}>{userRole.role}</Badge>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Desktop: Table layout */}
              <Card className="border-none shadow-sm hidden md:block">
                <CardContent className="p-0">
                  {usersWithRoles.length === 0 ? (
                    <div className="py-16 text-center text-muted-foreground">No users found</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Assigned</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usersWithRoles.map((userRole) => (
                          <TableRow key={userRole.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={userRole.profiles?.avatar_url || ""} />
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {userRole.profiles?.full_name?.[0] || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-foreground">
                                  {userRole.profiles?.full_name || "Unknown User"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getRoleBadgeVariant(userRole.role)}>{userRole.role}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(userRole.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Stores View */}
          {activeView === "stores" && (
            <div className="space-y-4 md:space-y-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground">Store Management</h2>
                <p className="text-sm text-muted-foreground">View, verify, and manage all stores</p>
              </div>

              {stores.length === 0 ? (
                <Card className="border-none shadow-sm">
                  <CardContent className="py-16 text-center text-muted-foreground">No stores yet</CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {stores.map((store) => (
                    <Card key={store.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4 md:p-5">
                        <div className="flex items-start gap-3 md:gap-4">
                          {store.logo ? (
                            <img src={store.logo} alt={store.name} className="w-12 h-12 md:w-14 md:h-14 rounded-xl object-cover shrink-0" />
                          ) : (
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <Store className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground truncate">{store.name}</h3>
                              {store.is_verified && (
                                <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1 mb-2 md:mb-3">
                              {store.description || "No description"}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2 md:mb-3 flex-wrap">
                              <span><Package className="w-3 h-3 inline mr-1" />{store.products_count || 0}</span>
                              <span><Users className="w-3 h-3 inline mr-1" />{store.followers || 0}</span>
                              <span>⭐ {store.rating?.toFixed(1) || "0.0"}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant={store.is_verified ? "outline" : "default"}
                                onClick={() => {
                                  setVerifyingStore({ id: store.id, name: store.name, verified: !!store.is_verified });
                                  setVerifyDialogOpen(true);
                                }}
                              >
                                {store.is_verified ? (
                                  <><ShieldOff className="w-3.5 h-3.5 mr-1" /> Unverify</>
                                ) : (
                                  <><ShieldCheck className="w-3.5 h-3.5 mr-1" /> Verify</>
                                )}
                              </Button>
                              <Button size="sm" variant="ghost" asChild>
                                <Link to={`/store/${store.id}`}>
                                  <Eye className="w-3.5 h-3.5 mr-1" /> View
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setDeletingStore({ id: store.id, name: store.name });
                                  setDeleteStoreDialog(true);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Banners View */}
          {activeView === "banners" && <AdminBannerManager />}

          {/* Promotions View */}
          {activeView === "promos" && <AdminPromoManager />}
        </main>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Application</DialogTitle>
              <DialogDescription>Provide a reason for rejection. The applicant will see this reason.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Incomplete business information..."
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={rejectApplication.isPending}>
                {rejectApplication.isPending ? "Rejecting..." : "Reject Application"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Verify/Unverify Dialog */}
        <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{verifyingStore?.verified ? "Unverify Store" : "Verify Store"}</DialogTitle>
              <DialogDescription>
                {verifyingStore?.verified
                  ? `Are you sure you want to remove verification from "${verifyingStore?.name}"?`
                  : `Are you sure you want to verify "${verifyingStore?.name}"? This will add a verified badge to the store.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>Cancel</Button>
              <Button variant={verifyingStore?.verified ? "destructive" : "default"} onClick={handleToggleVerify}>
                {verifyingStore?.verified ? "Remove Verification" : "Verify Store"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Store Dialog */}
        <Dialog open={deleteStoreDialog} onOpenChange={setDeleteStoreDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Store</DialogTitle>
              <DialogDescription>
                Are you sure you want to permanently delete "{deletingStore?.name}"? This action cannot be undone.
                All products and data associated with this store may also be affected.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteStoreDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteStore}>
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Store
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Order Status Dialog */}
        <Dialog open={updateStatusDialog} onOpenChange={setUpdateStatusDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Order Status</DialogTitle>
              <DialogDescription>
                Change the status for order {updatingOrder?.id.slice(0, 8)}...
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUpdateStatusDialog(false)}>Cancel</Button>
              <Button onClick={handleUpdateOrderStatus}>Update Status</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminOnly>
  );
};

export default AdminDashboard;
