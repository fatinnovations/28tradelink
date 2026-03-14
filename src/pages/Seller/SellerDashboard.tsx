import { Link } from "react-router-dom";
import {
  Package,
  ShoppingBag,
  DollarSign,
  Plus,
  Settings,
  Store,
  BarChart3,
  Boxes,
  Users,
  Cog,
} from "lucide-react";
import Header from "@/components/Header/Header";
import { useCurrency } from "@/contexts/CurrencyContext";
import Footer from "@/components/Footer/Footer";
import { SellerOnly } from "@/components/Auth/RoleGuard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/hooks/useProducts";
import { useStores } from "@/hooks/useStores";
import SellerOrdersTab from "@/components/Seller/SellerOrdersTab";
import SellerAnalyticsTab from "@/components/Seller/SellerAnalyticsTab";
import SellerInventoryTab from "@/components/Seller/SellerInventoryTab";
import SellerStorePoliciesTab from "@/components/Seller/SellerStorePoliciesTab";
import SellerCustomersTab from "@/components/Seller/SellerCustomersTab";

const SellerDashboard = () => {
  const { user } = useAuth();
  const { format: formatCurrency } = useCurrency();
  const { data: allProducts = [] } = useProducts();
  const { data: allStores = [] } = useStores();

  const myStores = allStores.filter((s) => s.owner_id === user?.id);
  const myProducts = allProducts.filter((p) =>
    myStores.some((s) => s.id === p.store_id)
  );

  const stats = {
    totalProducts: myProducts.length,
    totalStores: myStores.length,
    totalSold: myProducts.reduce((sum, p) => sum + (p.sold || 0), 0),
    revenue: myProducts.reduce(
      (sum, p) => sum + p.price * (p.sold || 0),
      0
    ),
  };

  return (
    <SellerOnly>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container py-4 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Seller Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Manage your stores and products
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link to="/seller/store/new">
                <Button size="sm" className="md:h-10 md:px-4">
                  <Plus className="w-4 h-4 mr-1 md:mr-2" />
                  New Store
                </Button>
              </Link>
              <Link to="/seller/product/new">
                <Button variant="outline" size="sm" className="md:h-10 md:px-4">
                  <Package className="w-4 h-4 mr-1 md:mr-2" />
                  Add Product
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Products
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Stores
                </CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStores}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Items Sold
                </CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSold}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.revenue)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="stores" className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
              <TabsTrigger value="stores" className="text-xs sm:text-sm">
                <Store className="w-3 h-3 mr-1 hidden sm:inline" />
                Stores
              </TabsTrigger>
              <TabsTrigger value="products" className="text-xs sm:text-sm">
                <Package className="w-3 h-3 mr-1 hidden sm:inline" />
                Products
              </TabsTrigger>
              <TabsTrigger value="inventory" className="text-xs sm:text-sm">
                <Boxes className="w-3 h-3 mr-1 hidden sm:inline" />
                Inventory
              </TabsTrigger>
              <TabsTrigger value="orders" className="text-xs sm:text-sm">
                <ShoppingBag className="w-3 h-3 mr-1 hidden sm:inline" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="customers" className="text-xs sm:text-sm">
                <Users className="w-3 h-3 mr-1 hidden sm:inline" />
                Customers
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm">
                <BarChart3 className="w-3 h-3 mr-1 hidden sm:inline" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm">
                <Cog className="w-3 h-3 mr-1 hidden sm:inline" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stores" className="space-y-4">
              {myStores.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No stores yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first store to start selling
                    </p>
                    <Link to="/seller/store/new">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Store
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myStores.map((store) => (
                    <Card key={store.id}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          {store.logo ? (
                            <img
                              src={store.logo}
                              alt={store.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Store className="w-6 h-6 text-primary" />
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-lg">
                              {store.name}
                            </CardTitle>
                            <CardDescription>
                              {store.products_count || 0} products
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Link to={`/store/${store.id}`}>
                            <Button variant="outline" size="sm">
                              View Store
                            </Button>
                          </Link>
                          <Link to={`/seller/store/${store.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              {myProducts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No products yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Add products to your store to start selling
                    </p>
                    <Link to="/seller/product/new">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Product
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {myProducts.map((product) => (
                    <Card key={product.id}>
                      <CardContent className="p-4">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.title}
                          className="w-full h-40 object-cover rounded mb-3"
                        />
                        <h3 className="font-medium line-clamp-2 mb-2 text-sm">
                          {product.title}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">
                            {formatCurrency(product.price)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {product.sold || 0} sold
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="inventory">
              <SellerInventoryTab products={myProducts} />
            </TabsContent>

            <TabsContent value="orders">
              <SellerOrdersTab />
            </TabsContent>

            <TabsContent value="customers">
              <SellerCustomersTab />
            </TabsContent>

            <TabsContent value="analytics">
              <SellerAnalyticsTab products={myProducts} />
            </TabsContent>

            <TabsContent value="settings">
              <SellerStorePoliciesTab stores={myStores} />
            </TabsContent>
          </Tabs>
        </main>

        <Footer />
      </div>
    </SellerOnly>
  );
};

export default SellerDashboard;
