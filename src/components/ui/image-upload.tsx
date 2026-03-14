import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  aspectRatio?: "square" | "banner";
  label?: string;
  description?: string;
}

const ImageUpload = ({
  value,
  onChange,
  folder = "general",
  aspectRatio = "square",
  label,
  description,
}: ImageUploadProps) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!user) return;

      // Validate file
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error("File must be less than 5MB");
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Only JPEG, PNG, WebP, and GIF images are allowed");
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${user.id}/${folder}/${Date.now()}.${ext}`;

      setIsUploading(true);
      try {
        const { error } = await supabase.storage
          .from("uploads")
          .upload(fileName, file, { upsert: true });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from("uploads")
          .getPublicUrl(fileName);

        onChange(urlData.publicUrl);
      } finally {
        setIsUploading(false);
      }
    },
    [user, folder, onChange]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadFile(file);
    } catch (err: any) {
      alert(err.message || "Upload failed");
    }
    // Reset input so re-selecting the same file triggers change
    e.target.value = "";
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      try {
        await uploadFile(file);
      } catch (err: any) {
        alert(err.message || "Upload failed");
      }
    },
    [uploadFile]
  );

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}

      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt="Upload preview"
            className={cn(
              "w-full object-cover rounded-lg border border-border",
              aspectRatio === "square" ? "aspect-square max-w-[200px]" : "aspect-[4/1] max-w-full"
            )}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors",
            aspectRatio === "square"
              ? "aspect-square max-w-[200px] p-4"
              : "aspect-[4/1] max-w-full p-6",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/50",
            isUploading && "pointer-events-none opacity-60"
          )}
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Click to upload
                </p>
                <p className="text-xs text-muted-foreground">
                  or drag and drop
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WebP up to 5MB
              </p>
            </>
          )}
        </div>
      )}

      {description && !value && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ImageUpload;
