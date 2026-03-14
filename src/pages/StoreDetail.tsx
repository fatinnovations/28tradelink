import { useParams, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useStore, useStoreProducts, useStores } from "@/hooks/useStores";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import StoreHeader from "@/components/Store/StoreHeader";
import StoreProductGrid from "@/components/Store/StoreProductGrid";
import StoreCard from "@/components/Store/StoreCard";
import { Skeleton } from "@/components/ui/skeleton";

const StoreDetail = () => {
  const { id } = useParams();
  const { data: store, isLoading: storeLoading } = useStore(id);
  const { data: storeProducts, isLoading: productsLoading } = useStoreProducts(id);
  const { data: allStores } = useStores({ limit: 5 });

  // Get related stores (exclude current store)
  const relatedStores = (allStores || []).filter((s) => s.id !== id).slice(0, 4);

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-4">
          <Skeleton className="h-4 w-64 mb-4" />
          <Skeleton className="h-64 w-full rounded-lg mb-4" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Store Not Found</h1>
          <Link to="/" className="text-primary hover:underline">
            Return to Home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/stores" className="hover:text-primary">Stores</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">{store.name}</span>
        </div>

        {/* Store Header */}
        <StoreHeader store={store} />

        {/* Products */}
        <div className="mt-4">
          <StoreProductGrid 
            products={storeProducts || []} 
            storeName={store.name} 
            isLoading={productsLoading}
          />
        </div>

        {/* Related Stores */}
        {relatedStores.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Similar Stores</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {relatedStores.map((s) => (
                <StoreCard key={s.id} store={s} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default StoreDetail;
