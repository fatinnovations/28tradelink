import { useState } from "react";
import {
  Package,
  AlertTriangle,
  Edit2,
  Trash2,
  Search,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useUpdateProduct, useDeleteProduct, type ProductWithStore } from "@/hooks/useProducts";
import { toast } from "sonner";

interface SellerInventoryTabProps {
  products: ProductWithStore[];
}

interface EditingState {
  id: string;
  price: number;
  title: string;
  stock_quantity: number;
}

const LOW_STOCK_THRESHOLD = 5;

const SellerInventoryTab = ({ products }: SellerInventoryTabProps) => {
  const { format: formatCurrency } = useCurrency();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<EditingState | null>(null);
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => (a.stock_quantity ?? 0) - (b.stock_quantity ?? 0));

  const lowStockProducts = products.filter(
    (p) => (p.stock_quantity ?? 0) <= LOW_STOCK_THRESHOLD
  );
  const outOfStockProducts = products.filter(
    (p) => (p.stock_quantity ?? 0) === 0
  );

  const handleSaveEdit = async () => {
    if (!editing) return;
    try {
      await updateProduct.mutateAsync({
        id: editing.id,
        price: editing.price,
        title: editing.title,
        stock_quantity: editing.stock_quantity,
      });
      toast.success("Product updated");
      setEditing(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct.mutateAsync(productId);
      toast.success("Product deleted");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  };

  const getStockBadge = (qty: number | null) => {
    const q = qty ?? 0;
    if (q === 0) return <Badge variant="destructive" className="text-[10px] h-4 px-1">Out of Stock</Badge>;
    if (q <= LOW_STOCK_THRESHOLD) return <Badge className="text-[10px] h-4 px-1 bg-orange-500 hover:bg-orange-600">Low Stock ({q})</Badge>;
    return <Badge variant="secondary" className="text-[10px] h-4 px-1">{q} in stock</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Low Stock Alert ({lowStockProducts.length} products)
            </CardTitle>
            <CardDescription className="text-xs">
              {outOfStockProducts.length > 0 && (
                <span className="text-destructive font-medium">{outOfStockProducts.length} out of stock. </span>
              )}
              {lowStockProducts.length - outOfStockProducts.length > 0 && (
                <span>{lowStockProducts.length - outOfStockProducts.length} running low (≤{LOW_STOCK_THRESHOLD} units)</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockProducts.slice(0, 6).map((p) => (
                <Badge key={p.id} variant="outline" className="text-xs">
                  {p.title.slice(0, 25)}… ({p.stock_quantity ?? 0} left)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{products.length}</p>
            <p className="text-xs text-muted-foreground">Total Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-destructive">{outOfStockProducts.length}</p>
            <p className="text-xs text-muted-foreground">Out of Stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{lowStockProducts.length - outOfStockProducts.length}</p>
            <p className="text-xs text-muted-foreground">Low Stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {products.filter((p) => (p.stock_quantity ?? 0) > LOW_STOCK_THRESHOLD).length}
            </p>
            <p className="text-xs text-muted-foreground">In Stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Product List */}
      <Card>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {search ? "No products match your search" : "No products yet"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sorted.map((product) => {
                const isEditing = editing?.id === product.id;

                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 sm:p-4 hover:bg-muted/30 transition-colors"
                  >
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.title}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded object-cover flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <Input
                          value={editing.title}
                          onChange={(e) =>
                            setEditing({ ...editing, title: e.target.value })
                          }
                          className="text-sm h-8 mb-1"
                        />
                      ) : (
                        <p className="text-sm font-medium line-clamp-1">
                          {product.title}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span>{product.sold || 0} sold</span>
                        <span>•</span>
                        {getStockBadge(product.stock_quantity)}
                        {product.free_shipping && (
                          <>
                            <span>•</span>
                            <Badge variant="secondary" className="text-[10px] h-4 px-1">
                              Free Shipping
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <div className="flex flex-col gap-1">
                            <Input
                              type="number"
                              value={editing.price}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  price: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-20 text-sm h-7"
                              step="0.01"
                              placeholder="Price"
                            />
                            <Input
                              type="number"
                              value={editing.stock_quantity}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  stock_quantity: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-20 text-sm h-7"
                              min="0"
                              placeholder="Stock"
                            />
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={handleSaveEdit}
                            disabled={updateProduct.isPending}
                          >
                            {updateProduct.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3 text-green-600" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setEditing(null)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm font-bold text-primary">
                            {formatCurrency(product.price)}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() =>
                              setEditing({
                                id: product.id,
                                price: product.price,
                                title: product.title,
                                stock_quantity: product.stock_quantity ?? 0,
                              })
                            }
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete product?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  "{product.title}" will be permanently removed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(product.id)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerInventoryTab;
