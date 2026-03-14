import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Package, ArrowLeft, Loader2 } from "lucide-react";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { SellerOnly } from "@/components/Auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import ImageUpload from "@/components/ui/image-upload";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCreateProduct } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useStores } from "@/hooks/useStores";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const productSchema = z.object({
  store_id: z.string().min(1, "Please select a store"),
  category_id: z.string().optional(),
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be less than 2000 characters")
    .optional(),
  price: z
    .number({ invalid_type_error: "Price is required" })
    .min(0.01, "Price must be at least $0.01")
    .max(999999, "Price must be less than $999,999"),
  original_price: z
    .number()
    .min(0.01, "Original price must be at least $0.01")
    .optional()
    .nullable(),
  image: z.string().optional().or(z.literal("")),
  shipping_price: z
    .number()
    .min(0, "Shipping price cannot be negative")
    .optional()
    .nullable(),
  free_shipping: z.boolean().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const CreateProduct = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createProductMutation = useCreateProduct();
  const { data: categories = [] } = useCategories();
  const { data: allStores = [] } = useStores();

  const myStores = allStores.filter((s) => s.owner_id === user?.id);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      store_id: "",
      category_id: "",
      title: "",
      description: "",
      price: 0,
      original_price: null,
      image: "",
      shipping_price: null,
      free_shipping: false,
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    try {
      const product = await createProductMutation.mutateAsync({
        store_id: data.store_id,
        category_id: data.category_id || null,
        title: data.title,
        description: data.description || null,
        price: data.price,
        original_price: data.original_price || null,
        image: data.image || null,
        shipping_price: data.free_shipping ? 0 : (data.shipping_price || null),
        free_shipping: data.free_shipping || false,
      });
      toast.success("Product created successfully!");
      navigate(`/product/${product.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create product");
    }
  };

  const freeShipping = form.watch("free_shipping");

  return (
    <SellerOnly>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container py-6 max-w-2xl">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate("/seller/dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Add New Product</CardTitle>
                  <CardDescription>
                    List a new product in your store
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {myStores.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No stores yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create a store first before adding products
                  </p>
                  <Button onClick={() => navigate("/seller/store/new")}>
                    Create Store
                  </Button>
                </div>
              ) : (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="store_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a store" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {myStores.map((store) => (
                                <SelectItem key={store.id} value={store.id}>
                                  {store.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose which store to list this product in
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id}
                                >
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Helps customers find your product
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Title *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter product title"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Be specific and descriptive for better search
                            results
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your product..."
                              className="resize-none"
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Include key features, specifications, and benefits
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="original_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Original Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseFloat(e.target.value)
                                      : null
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Set if on sale
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Image</FormLabel>
                          <FormControl>
                            <ImageUpload
                              value={field.value}
                              onChange={field.onChange}
                              folder="product-images"
                              aspectRatio="square"
                              description="Square format recommended (e.g. 800×800)"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="free_shipping"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Free Shipping</FormLabel>
                            <FormDescription>
                              Offer free shipping for this product
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {!freeShipping && (
                      <FormField
                        control={form.control}
                        name="shipping_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Shipping Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseFloat(e.target.value)
                                      : null
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate("/seller/dashboard")}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={createProductMutation.isPending}
                      >
                        {createProductMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Product"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </SellerOnly>
  );
};

export default CreateProduct;
