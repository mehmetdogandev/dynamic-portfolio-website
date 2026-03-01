"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageEdit, type ImageEditHandle } from "@/components/ui/image-edit";
import { LogoPreviewSlots } from "@/components/logos/logo-preview-slots";
import { api } from "@/lib/trpc/react";
import { getErrorMessage } from "@/lib/trpc/error-messages";

type CreateLogosDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const LOGO_TYPES = [
  { value: "WEBSITE_LOGO", label: "Web sitesi logosu" },
  { value: "WEBSITE_FAVICON", label: "Web sitesi favicon" },
  { value: "EMAIL_LOGO", label: "E-posta logosu" },
  { value: "EMAIL_FAVICON", label: "E-posta favicon" },
] as const;

export function CreateLogosDialog({ open, onOpenChange }: CreateLogosDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"WEBSITE_LOGO" | "WEBSITE_FAVICON" | "EMAIL_LOGO" | "EMAIL_FAVICON">("WEBSITE_LOGO");
  const [status, setStatus] = useState<"ACTIVE" | "PASSIVE">("PASSIVE");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [croppedBase64, setCroppedBase64] = useState<string | null>(null);
  const [croppedMime, setCroppedMime] = useState<string>("image/png");
  const imageEditRef = useRef<ImageEditHandle>(null);
  const router = useRouter();
  const utils = api.useUtils();
  const createMutation = api.logo.create.useMutation({
    onSuccess: () => {
      void utils.logo.list.invalidate();
      void utils.logo.getActivePublic.invalidate();
      void utils.logo.getActivesPublic.invalidate();
      router.refresh();
      onOpenChange(false);
      resetForm();
    },
  });

  function resetForm() {
    setName("");
    setType("WEBSITE_LOGO");
    setStatus("PASSIVE");
    setPreviewSrc(null);
    setCroppedBase64(null);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewSrc(result);
      setCroppedBase64(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = useCallback((base64: string, mimeType: string) => {
    setCroppedBase64(base64);
    setCroppedMime(mimeType);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (croppedBase64) {
      createMutation.mutate({
        name,
        type,
        imageBase64: croppedBase64,
        imageMimeType: croppedMime,
        status,
      });
    } else {
      void imageEditRef.current?.getCroppedImage().then((result) => {
        if (result) {
          createMutation.mutate({
            name,
            type,
            imageBase64: result.base64,
            imageMimeType: result.mimeType,
            status,
          });
        }
      });
    }
  }

  const canSubmit = name.trim() && previewSrc;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 px-6 pt-6">
          <DialogTitle>Yeni Logo</DialogTitle>
          <DialogDescription>
            Logo görselini seçin, boyutlarını düzenleyin ve kaydedin.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-logo-file">Logo Görseli</Label>
                <Input
                  id="create-logo-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={createMutation.isPending}
                />
              </div>
              {previewSrc && (
                <>
                  <div className="space-y-2">
                    <Label>Kırpma (opsiyonel)</Label>
                    <div className="w-full overflow-hidden rounded-md border">
                      <ImageEdit
                        ref={imageEditRef}
                        src={previewSrc}
                        aspectRatio={1}
                        maxWidth={320}
                        maxHeight={320}
                        maxDisplayHeight={240}
                        onCropComplete={handleCropComplete}
                        showApplyButton={true}
                        disabled={createMutation.isPending}
                      />
                    </div>
                  </div>
                  <LogoPreviewSlots previewSrc={croppedBase64 ?? previewSrc} />
                </>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="create-logo-type">Tip</Label>
                  <select
                    id="create-logo-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as typeof type)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    disabled={createMutation.isPending}
                  >
                    {LOGO_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-logo-status">Durum</Label>
                  <select
                    id="create-logo-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "ACTIVE" | "PASSIVE")}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    disabled={createMutation.isPending}
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="PASSIVE">Pasif</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-logo-name">Ad</Label>
                <Input
                  id="create-logo-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={createMutation.isPending}
                />
              </div>
              {createMutation.error && (
                <p className="text-sm text-destructive">{getErrorMessage(createMutation.error)}</p>
              )}
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t bg-muted/30 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              İptal
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !canSubmit}>
              {createMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
