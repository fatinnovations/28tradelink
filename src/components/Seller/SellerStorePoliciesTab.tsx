import { useState } from "react";
import {
  Settings,
  Clock,
  RotateCcw,
  Megaphone,
  Loader2,
  MapPin,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUpdateStore, type Store } from "@/hooks/useStores";
import { toast } from "sonner";

interface SellerStorePoliciesTabProps {
  stores: Store[];
}

interface StoreFormState {
  description: string;
  location: string;
}

const SellerStorePoliciesTab = ({ stores }: SellerStorePoliciesTabProps) => {
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id || "");
  const selectedStore = stores.find((s) => s.id === selectedStoreId);
  const updateStore = useUpdateStore();

  const [formState, setFormState] = useState<StoreFormState>({
    description: selectedStore?.description || "",
    location: selectedStore?.location || "",
  });

  const handleStoreChange = (id: string) => {
    setSelectedStoreId(id);
    const store = stores.find((s) => s.id === id);
    setFormState({
      description: store?.description || "",
      location: store?.location || "",
    });
  };

  const handleSave = async () => {
    if (!selectedStoreId) return;
    try {
      await updateStore.mutateAsync({
        id: selectedStoreId,
        description: formState.description || null,
        location: formState.location || null,
      });
      toast.success("Store settings saved!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  };

  if (stores.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No stores yet</h3>
          <p className="text-muted-foreground">
            Create a store first to manage settings
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Store Selector */}
      {stores.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {stores.map((store) => (
            <Button
              key={store.id}
              variant={store.id === selectedStoreId ? "default" : "outline"}
              size="sm"
              onClick={() => handleStoreChange(store.id)}
              className="flex-shrink-0"
            >
              {store.name}
            </Button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Store Information
            </CardTitle>
            <CardDescription>Basic store details and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Store Name</Label>
              <Input value={selectedStore?.name || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                Edit store name from the store edit page
              </p>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formState.description}
                onChange={(e) =>
                  setFormState({ ...formState, description: e.target.value })
                }
                placeholder="Tell customers about your store, what you sell, and your values…"
                rows={4}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                Location
              </Label>
              <Input
                value={formState.location}
                onChange={(e) =>
                  setFormState({ ...formState, location: e.target.value })
                }
                placeholder="e.g. Lilongwe, Malawi"
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Business Hours
            </CardTitle>
            <CardDescription>Let customers know when you're available</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Monday - Friday", "Saturday", "Sunday"].map((day) => (
              <div key={day} className="flex items-center justify-between gap-3">
                <Label className="text-sm w-32 flex-shrink-0">{day}</Label>
                <div className="flex items-center gap-2 flex-1">
                  <Input placeholder="08:00" className="text-sm h-9" />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input placeholder="17:00" className="text-sm h-9" />
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground mt-2">
              Business hours are displayed on your store page
            </p>
          </CardContent>
        </Card>

        {/* Return Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Return Policy
            </CardTitle>
            <CardDescription>Define your return and refund rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Describe your return policy. E.g.: We accept returns within 7 days of delivery. Items must be unused and in original packaging…"
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              A clear return policy builds customer trust and reduces disputes
            </p>
          </CardContent>
        </Card>

        {/* Store Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              Store Announcement
            </CardTitle>
            <CardDescription>
              Display a message banner on your store page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="E.g.: 🎉 Free shipping on all orders this week! Use code FREE28 at checkout…"
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Announcements appear at the top of your store page
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateStore.isPending} size="lg">
          {updateStore.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default SellerStorePoliciesTab;
