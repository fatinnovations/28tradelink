import { useState } from "react";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Save, Megaphone, Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  usePromotionalBanners, useCreatePromo, useUpdatePromo, useDeletePromo,
  type PromotionalBanner,
} from "@/hooks/usePromotionalBanners";
import { usePromoAnalyticsSummary } from "@/hooks/usePromoAnalytics";
import ImageUpload from "@/components/ui/image-upload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const emptyPromo: Partial<PromotionalBanner> = {
  title: "",
  message: "",
  link_url: "",
  link_text: "Shop Now",
  banner_type: "bar",
  background_color: "#ef4444",
  text_color: "#ffffff",
  image_url: "",
  start_date: new Date().toISOString(),
  end_date: new Date(Date.now() + 7 * 86400000).toISOString(),
  is_active: true,
  is_dismissible: true,
  sort_order: 0,
};

const AdminPromoManager = () => {
  const { data: promos = [], isLoading } = usePromotionalBanners(false);
  const { data: analyticsSummary = [] } = usePromoAnalyticsSummary();
  const createPromo = useCreatePromo();
  const updatePromo = useUpdatePromo();
  const deletePromo = useDeletePromo();

  const getAnalytics = (promoId: string) => {
    const found = analyticsSummary.find((a) => a.promo_id === promoId);
    return found || { impressions: 0, clicks: 0, ctr: 0 };
  };

  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editing, setEditing] = useState<Partial<PromotionalBanner>>(emptyPromo);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);

  const openNew = () => {
    setEditing({ ...emptyPromo, sort_order: promos.length });
    setIsNew(true);
    setEditDialog(true);
  };

  const openEdit = (promo: PromotionalBanner) => {
    setEditing({ ...promo });
    setIsNew(false);
    setEditDialog(true);
  };

  const handleSave = async () => {
    if (!editing.title?.trim()) { toast.error("Title is required"); return; }
    if (!editing.start_date || !editing.end_date) { toast.error("Dates are required"); return; }

    try {
      if (isNew) {
        await createPromo.mutateAsync(editing as any);
        toast.success("Promo created!");
      } else {
        await updatePromo.mutateAsync({ id: editing.id!, ...editing } as any);
        toast.success("Promo updated!");
      }
      setEditDialog(false);
    } catch {
      toast.error("Failed to save promo");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deletePromo.mutateAsync(deletingId);
      toast.success("Promo deleted");
      setDeleteDialog(false);
    } catch {
      toast.error("Failed to delete promo");
    }
  };

  const handleToggleActive = async (promo: PromotionalBanner) => {
    try {
      await updatePromo.mutateAsync({ id: promo.id, is_active: !promo.is_active });
      toast.success(promo.is_active ? "Promo hidden" : "Promo activated");
    } catch {
      toast.error("Failed to update promo");
    }
  };

  const getStatus = (promo: PromotionalBanner) => {
    const now = new Date();
    const start = new Date(promo.start_date);
    const end = new Date(promo.end_date);
    if (!promo.is_active) return "inactive";
    if (now < start) return "scheduled";
    if (now > end) return "expired";
    return "live";
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "live": return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Live</Badge>;
      case "scheduled": return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">Scheduled</Badge>;
      case "expired": return <Badge className="bg-muted text-muted-foreground">Expired</Badge>;
      default: return <Badge variant="outline">Inactive</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Promotional Banners</h2>
          <p className="text-muted-foreground">Schedule promotional banners and popups</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Add Promo
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : promos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No promotions yet</h3>
            <p className="text-muted-foreground mb-4">Create your first promotional banner or popup</p>
            <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add Promo</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {promos.map((promo) => {
            const status = getStatus(promo);
            return (
              <Card key={promo.id} className={`border ${status === "inactive" || status === "expired" ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-32 h-16 rounded-lg shrink-0 flex items-center justify-center overflow-hidden text-center"
                      style={{
                        backgroundColor: promo.image_url ? undefined : (promo.background_color || "#ef4444"),
                        backgroundImage: promo.image_url ? `url(${promo.image_url})` : undefined,
                        backgroundSize: "cover", backgroundPosition: "center",
                        color: promo.text_color || "#fff",
                      }}
                    >
                      <span className="text-[10px] font-bold px-1 line-clamp-2">{promo.title}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm truncate">{promo.title}</h4>
                        {statusBadge(status)}
                        <Badge variant="outline" className="text-xs">{promo.banner_type === "popup" ? "Popup" : "Bar"}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{promo.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(promo.start_date), "MMM d, yyyy")} → {format(new Date(promo.end_date), "MMM d, yyyy")}
                      </p>
                    </div>

                    {/* Analytics Stats */}
                    {(() => {
                      const stats = getAnalytics(promo.id);
                      return (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                          <div className="text-center">
                            <p className="text-base font-bold text-foreground">{stats.impressions}</p>
                            <p>Views</p>
                          </div>
                          <div className="text-center">
                            <p className="text-base font-bold text-foreground">{stats.clicks}</p>
                            <p>Clicks</p>
                          </div>
                          <div className="text-center">
                            <p className="text-base font-bold text-foreground">{stats.ctr.toFixed(1)}%</p>
                            <p>CTR</p>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleActive(promo)}>
                        {promo.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(promo)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setDeletingId(promo.id); setDeleteDialog(true); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "Create Promotion" : "Edit Promotion"}</DialogTitle>
            <DialogDescription>
              {isNew ? "Schedule a new promotional banner or popup" : "Update promotion details"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={editing.banner_type || "bar"} onValueChange={(v) => setEditing({ ...editing, banner_type: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Top Bar Banner</SelectItem>
                    <SelectItem value="popup">Popup Modal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Flash Sale!" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={editing.message || ""} onChange={(e) => setEditing({ ...editing, message: e.target.value })} placeholder="Get up to 50% off all electronics..." rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Link Text</Label>
                <Input value={editing.link_text || ""} onChange={(e) => setEditing({ ...editing, link_text: e.target.value })} placeholder="Shop Now" />
              </div>
              <div className="space-y-2">
                <Label>Link URL</Label>
                <Input value={editing.link_url || ""} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} placeholder="/deals" />
              </div>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editing.start_date && "text-muted-foreground")}>
                      {editing.start_date ? format(new Date(editing.start_date), "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker mode="single" selected={editing.start_date ? new Date(editing.start_date) : undefined} onSelect={(d) => d && setEditing({ ...editing, start_date: d.toISOString() })} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Calendar className="w-4 h-4" /> End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editing.end_date && "text-muted-foreground")}>
                      {editing.end_date ? format(new Date(editing.end_date), "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker mode="single" selected={editing.end_date ? new Date(editing.end_date) : undefined} onSelect={(d) => d && setEditing({ ...editing, end_date: d.toISOString() })} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Image (for popup) */}
            {editing.banner_type === "popup" && (
              <ImageUpload
                value={editing.image_url || ""}
                onChange={(url) => setEditing({ ...editing, image_url: url })}
                folder="promos"
                label="Popup Image"
                description="Optional image for the popup modal"
              />
            )}

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex gap-2">
                  <input type="color" value={editing.background_color || "#ef4444"} onChange={(e) => setEditing({ ...editing, background_color: e.target.value })} className="w-10 h-10 rounded border border-border cursor-pointer" />
                  <Input value={editing.background_color || "#ef4444"} onChange={(e) => setEditing({ ...editing, background_color: e.target.value })} className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Text Color</Label>
                <div className="flex gap-2">
                  <input type="color" value={editing.text_color || "#ffffff"} onChange={(e) => setEditing({ ...editing, text_color: e.target.value })} className="w-10 h-10 rounded border border-border cursor-pointer" />
                  <Input value={editing.text_color || "#ffffff"} onChange={(e) => setEditing({ ...editing, text_color: e.target.value })} className="flex-1" />
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div><Label>Active</Label><p className="text-xs text-muted-foreground">Enable this promotion</p></div>
                <Switch checked={editing.is_active ?? true} onCheckedChange={(c) => setEditing({ ...editing, is_active: c })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div><Label>Dismissible</Label><p className="text-xs text-muted-foreground">Allow users to close this promo</p></div>
                <Switch checked={editing.is_dismissible ?? true} onCheckedChange={(c) => setEditing({ ...editing, is_dismissible: c })} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createPromo.isPending || updatePromo.isPending}>
              <Save className="w-4 h-4 mr-2" /> {isNew ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Promotion</DialogTitle>
            <DialogDescription>Are you sure? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deletePromo.isPending}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPromoManager;
