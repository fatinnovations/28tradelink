import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Store, ArrowLeft, Loader2 } from "lucide-react";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { SellerOnly } from "@/components/Auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCreateStore } from "@/hooks/useStores";
import { toast } from "sonner";

const storeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Store name must be at least 3 characters")
    .max(50, "Store name must be less than 50 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  logo: z.string().optional().or(z.literal("")),
  banner: z.string().optional().or(z.literal("")),
  location: z
    .string()
    .trim()
    .max(100, "Location must be less than 100 characters")
    .optional(),
});

type StoreFormData = z.infer<typeof storeSchema>;

const CreateStore = () => {
  const navigate = useNavigate();
  const createStoreMutation = useCreateStore();

  const form = useForm<StoreFormData>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: "",
      description: "",
      logo: "",
      banner: "",
      location: "",
    },
  });

  const onSubmit = async (data: StoreFormData) => {
    try {
      const store = await createStoreMutation.mutateAsync({
        name: data.name,
        description: data.description || null,
        logo: data.logo || null,
        banner: data.banner || null,
        location: data.location || null,
      });
      toast.success("Store created successfully!");
      navigate(`/store/${store.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create store");
    }
  };

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
                  <Store className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Create New Store</CardTitle>
                  <CardDescription>
                    Set up your store to start selling products
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your store name"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This will be displayed to customers
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
                            placeholder="Tell customers about your store..."
                            className="resize-none"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A brief description of your store and what you sell
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="logo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Logo</FormLabel>
                        <FormControl>
                          <ImageUpload
                            value={field.value}
                            onChange={field.onChange}
                            folder="store-logos"
                            aspectRatio="square"
                            description="Square format recommended (e.g. 500×500)"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="banner"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Banner</FormLabel>
                        <FormControl>
                          <ImageUpload
                            value={field.value}
                            onChange={field.onChange}
                            folder="store-banners"
                            aspectRatio="banner"
                            description="Recommended size: 1200×300"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="City, Country" {...field} />
                        </FormControl>
                        <FormDescription>
                          Where your store is based
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                      disabled={createStoreMutation.isPending}
                    >
                      {createStoreMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Store"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </SellerOnly>
  );
};

export default CreateStore;
