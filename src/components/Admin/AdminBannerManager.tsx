import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Palette,
  Save,
  X,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useHeroBanners,
  useCreateBanner,
  useUpdateBanner,
  useDeleteBanner,
  type HeroBanner,
} from "@/hooks/useHeroBanners";
import ImageUpload from "@/components/ui/image-upload";
import { toast } from "sonner";

const emptyBanner = {
  title: "",
  subtitle: "",
  description: "",
  cta_text: "Shop Now",
  cta_link: "/deals",
  background_image: "",
  background_color: "#3b82f6",
  text_color: "#ffffff",
  is_active: true,
  sort_order: 0,
};

const AdminBannerManager = () => {
  const { data: banners = [], isLoading } = useHeroBanners(false);
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();

  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<HeroBanner>>(emptyBanner);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);

  const openNew = () => {
    setEditingBanner({ ...emptyBanner, sort_order: banners.length });
    setIsNew(true);
    setEditDialog(true);
  };

  const openEdit = (banner: HeroBanner) => {
    setEditingBanner({ ...banner });
    setIsNew(false);
    setEditDialog(true);
  };

  const openDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialog(true);
  };

  const handleSave = async () => {
    if (!editingBanner.title?.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      if (isNew) {
        await createBanner.mutateAsync(editingBanner as any);
        toast.success("Banner created!");
      } else {
        await updateBanner.mutateAsync({ id: editingBanner.id!, ...editingBanner } as any);
        toast.success("Banner updated!");
      }
      setEditDialog(false);
    } catch {
      toast.error("Failed to save banner");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteBanner.mutateAsync(deletingId);
      toast.success("Banner deleted");
      setDeleteDialog(false);
    } catch {
      toast.error("Failed to delete banner");
    }
  };

  const handleToggleActive = async (banner: HeroBanner) => {
    try {
      await updateBanner.mutateAsync({ id: banner.id, is_active: !banner.is_active });
      toast.success(banner.is_active ? "Banner hidden" : "Banner activated");
    } catch {
      toast.error("Failed to update banner");
    }
  };

  const handleMoveUp = async (banner: HeroBanner, index: number) => {
    if (index === 0) return;
    const prev = banners[index - 1];
    try {
      await updateBanner.mutateAsync({ id: banner.id, sort_order: prev.sort_order });
      await updateBanner.mutateAsync({ id: prev.id, sort_order: banner.sort_order });
    } catch {
      toast.error("Failed to reorder");
    }
  };

  const handleMoveDown = async (banner: HeroBanner, index: number) => {
    if (index >= banners.length - 1) return;
    const next = banners[index + 1];
    try {
      await updateBanner.mutateAsync({ id: banner.id, sort_order: next.sort_order });
      await updateBanner.mutateAsync({ id: next.id, sort_order: banner.sort_order });
    } catch {
      toast.error("Failed to reorder");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Hero Banners</h2>
          <p className="text-muted-foreground">Manage homepage hero carousel banners</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add Banner
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading banners...</div>
      ) : banners.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No banners yet</h3>
            <p className="text-muted-foreground mb-4">Create your first hero banner</p>
            <Button onClick={openNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add Banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {banners.map((banner, index) => (
            <Card key={banner.id} className={`border ${!banner.is_active ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Preview thumbnail */}
                  <div
                    className="w-32 h-20 rounded-lg shrink-0 flex items-center justify-center overflow-hidden"
                    style={{
                      backgroundColor: banner.background_image ? undefined : (banner.background_color || "#3b82f6"),
                      backgroundImage: banner.background_image ? `url(${banner.background_image})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      color: banner.text_color || "#ffffff",
                    }}
                  >
                    <span className="text-[10px] font-bold text-center px-1 line-clamp-2">
                      {banner.title}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm truncate">{banner.title}</h4>
                      {!banner.is_active && (
                        <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Hidden</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{banner.subtitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      CTA: {banner.cta_text} → {banner.cta_link}
                    </p>
                  </div>

                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === 0}
                      onClick={() => handleMoveUp(banner, index)}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === banners.length - 1}
                      onClick={() => handleMoveDown(banner, index)}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleActive(banner)}
                      title={banner.is_active ? "Hide banner" : "Show banner"}
                    >
                      {banner.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(banner)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => openDelete(banner.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "Create Banner" : "Edit Banner"}</DialogTitle>
            <DialogDescription>
              {isNew ? "Add a new hero banner to the homepage carousel" : "Update banner content and appearance"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Preview */}
            <div
              className="w-full h-40 rounded-lg flex items-center justify-center overflow-hidden"
              style={{
                backgroundColor: editingBanner.background_image ? undefined : (editingBanner.background_color || "#3b82f6"),
                backgroundImage: editingBanner.background_image ? `url(${editingBanner.background_image})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                color: editingBanner.text_color || "#ffffff",
              }}
            >
              <div className="text-center px-4">
                <p className="text-xs opacity-80">{editingBanner.description || "Description"}</p>
                <h3 className="text-2xl font-bold">{editingBanner.title || "Banner Title"}</h3>
                <p className="text-lg font-semibold">{editingBanner.subtitle || "Subtitle"}</p>
                <span className="inline-block mt-2 px-4 py-1 bg-white/90 text-foreground rounded-full text-sm font-medium">
                  {editingBanner.cta_text || "CTA"}
                </span>
              </div>
            </div>

            {/* Content fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={editingBanner.title || ""}
                  onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                  placeholder="e.g. Welcome to 28TradeLink"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  value={editingBanner.subtitle || ""}
                  onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                  placeholder="e.g. Up to 70% Off"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={editingBanner.description || ""}
                onChange={(e) => setEditingBanner({ ...editingBanner, description: e.target.value })}
                placeholder="e.g. First order deals for new users"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CTA Button Text</Label>
                <Input
                  value={editingBanner.cta_text || ""}
                  onChange={(e) => setEditingBanner({ ...editingBanner, cta_text: e.target.value })}
                  placeholder="Shop Now"
                />
              </div>
              <div className="space-y-2">
                <Label>CTA Link</Label>
                <Input
                  value={editingBanner.cta_link || ""}
                  onChange={(e) => setEditingBanner({ ...editingBanner, cta_link: e.target.value })}
                  placeholder="/deals"
                />
              </div>
            </div>

            {/* Background */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Background</Label>
              <ImageUpload
                value={editingBanner.background_image || ""}
                onChange={(url) => setEditingBanner({ ...editingBanner, background_image: url })}
                folder="banners"
                aspectRatio="banner"
                label="Background Image"
                description="Upload a banner background image. If empty, the background color will be used."
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Background Color (fallback)
                  </Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={editingBanner.background_color || "#3b82f6"}
                      onChange={(e) => setEditingBanner({ ...editingBanner, background_color: e.target.value })}
                      className="w-10 h-10 rounded border border-border cursor-pointer"
                    />
                    <Input
                      value={editingBanner.background_color || "#3b82f6"}
                      onChange={(e) => setEditingBanner({ ...editingBanner, background_color: e.target.value })}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Text Color
                  </Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={editingBanner.text_color || "#ffffff"}
                      onChange={(e) => setEditingBanner({ ...editingBanner, text_color: e.target.value })}
                      className="w-10 h-10 rounded border border-border cursor-pointer"
                    />
                    <Input
                      value={editingBanner.text_color || "#ffffff"}
                      onChange={(e) => setEditingBanner({ ...editingBanner, text_color: e.target.value })}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Show this banner on the homepage</p>
              </div>
              <Switch
                checked={editingBanner.is_active ?? true}
                onCheckedChange={(checked) => setEditingBanner({ ...editingBanner, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={createBanner.isPending || updateBanner.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {isNew ? "Create Banner" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Banner</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this banner? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteBanner.isPending}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBannerManager;
