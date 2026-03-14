import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ChevronRight, MapPin, Plus, Trash2, Loader2, Save } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ShippingAddress {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean | null;
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name: "", phone: "", address: "", city: "", state: "", zip_code: "", country: "",
  });

  // Fetch profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "" });

  useEffect(() => {
    if (profile) {
      setProfileForm({ full_name: profile.full_name || "", phone: profile.phone || "" });
    }
  }, [profile]);

  // Update profile
  const updateProfile = useMutation({
    mutationFn: async (data: { full_name: string; phone: string }) => {
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase.from("profiles").update(data).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Profile updated successfully" });
    },
    onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
  });

  // Fetch addresses
  const { data: addresses = [], isLoading: addressesLoading } = useQuery({
    queryKey: ["shipping-addresses", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("shipping_addresses").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data as ShippingAddress[];
    },
    enabled: !!user,
  });

  // Add address
  const addAddress = useMutation({
    mutationFn: async (addr: typeof newAddress) => {
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase.from("shipping_addresses").insert({ ...addr, user_id: user.id, is_default: addresses.length === 0 });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-addresses"] });
      setAddressDialogOpen(false);
      setNewAddress({ full_name: "", phone: "", address: "", city: "", state: "", zip_code: "", country: "" });
      toast({ title: "Address added" });
    },
    onError: () => toast({ title: "Failed to add address", variant: "destructive" }),
  });

  // Delete address
  const deleteAddress = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shipping_addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-addresses"] });
      toast({ title: "Address removed" });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center">
          <p className="text-muted-foreground mb-4">Please sign in to access settings.</p>
          <Link to="/auth"><Button>Sign In</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 max-w-3xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">Settings</span>
        </div>

        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        {/* Profile Section */}
        <div className="bg-card rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">Profile Information</h2>
          {profileLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={user.email || ""} disabled className="mt-1" />
              </div>
              <div>
                <Label>Full Name</Label>
                <Input
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="Enter phone number"
                  className="mt-1"
                />
              </div>
              <Button
                onClick={() => updateProfile.mutate(profileForm)}
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Profile
              </Button>
            </div>
          )}
        </div>

        {/* Delivery Addresses */}
        <div className="bg-card rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Delivery Addresses</h2>
            <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Address</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Delivery Address</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Full Name</Label><Input value={newAddress.full_name} onChange={(e) => setNewAddress((a) => ({ ...a, full_name: e.target.value }))} className="mt-1" /></div>
                  <div><Label>Phone</Label><Input value={newAddress.phone} onChange={(e) => setNewAddress((a) => ({ ...a, phone: e.target.value }))} className="mt-1" /></div>
                  <div><Label>Address</Label><Input value={newAddress.address} onChange={(e) => setNewAddress((a) => ({ ...a, address: e.target.value }))} className="mt-1" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>City</Label><Input value={newAddress.city} onChange={(e) => setNewAddress((a) => ({ ...a, city: e.target.value }))} className="mt-1" /></div>
                    <div><Label>State</Label><Input value={newAddress.state} onChange={(e) => setNewAddress((a) => ({ ...a, state: e.target.value }))} className="mt-1" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Zip Code</Label><Input value={newAddress.zip_code} onChange={(e) => setNewAddress((a) => ({ ...a, zip_code: e.target.value }))} className="mt-1" /></div>
                    <div><Label>District</Label><Input value={newAddress.country} onChange={(e) => setNewAddress((a) => ({ ...a, country: e.target.value }))} placeholder="e.g. Lilongwe" className="mt-1" /></div>
                  </div>
                  <Button className="w-full" onClick={() => addAddress.mutate(newAddress)} disabled={addAddress.isPending || !newAddress.full_name || !newAddress.phone || !newAddress.address}>
                    {addAddress.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Save Address
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {addressesLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No delivery addresses saved yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div key={addr.id} className="flex items-start justify-between p-3 rounded-lg border">
                  <div className="text-sm">
                    <p className="font-medium">{addr.full_name} {addr.is_default && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-2">Default</span>}</p>
                    <p className="text-muted-foreground">{addr.phone}</p>
                     <p className="text-muted-foreground">{addr.country} — {addr.city}</p>
                    <p className="text-muted-foreground">{addr.address}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteAddress.mutate(addr.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="bg-card rounded-lg shadow-sm p-6">
          <h2 className="font-bold text-lg mb-4">Account</h2>
          <div className="text-sm text-muted-foreground">
            <p>Signed in as <span className="font-medium text-foreground">{user.email}</span></p>
            <p className="mt-1">Account created: {format(new Date(user.created_at), "MMM d, yyyy")}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Settings;
