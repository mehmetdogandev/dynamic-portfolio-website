"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { api } from "@/lib/trpc/react";
import { getErrorMessage } from "@/lib/trpc/error-messages";

type UpdateLogosDialogProps = {
  logoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UpdateLogosDialog({ logoId, open, onOpenChange }: UpdateLogosDialogProps) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "PASSIVE">("PASSIVE");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [croppedBase64, setCroppedBase64] = useState<string | null>(null);
  const [croppedMime, setCroppedMime] = useState<string>("image/png");
  const imageEditRef = useRef<ImageEditHandle>(null);
  const { data: logo, isLoading } = api.logo.getById.useQuery(
    { id: logoId },
    { enabled: open && !!logoId }
  );
  const utils = api.useUtils();
  const updateMutation = api.logo.update.useMutation({
    onSuccess: () => {
      void utils.logo.list.invalidate();
      void utils.logo.getActivePublic.invalidate();
      void utils.logo.getById.invalidate({ id: logoId });
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (logo) {
      setName(logo.name);
      if (logo.status === "ACTIVE" || logo.status === "PASSIVE") {
        setStatus(logo.status);
      }
    }
  }, [logo]);

  useEffect(() => {
    if (logo?.fileId) {
      setPreviewSrc(`/api/files/${logo.fileId}/view`);
    } else {
      setPreviewSrc(null);
    }
  }, [logo?.fileId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewSrc(reader.result as string);
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
    const payload: { id: string; name: string; status: "ACTIVE" | "PASSIVE"; imageBase64?: string; imageMimeType?: string } = {
      id: logoId,
      name,
      status,
    };
    if (croppedBase64) {
      payload.imageBase64 = croppedBase64;
      payload.imageMimeType = croppedMime;
    } else if (previewSrc?.startsWith("data:")) {
      void imageEditRef.current?.getCroppedImage().then((result) => {
        if (result) {
          updateMutation.mutate({
            id: logoId,
            name,
            status,
            imageBase64: result.base64,
            imageMimeType: result.mimeType,
          });
        }
      });
      return;
    }
    updateMutation.mutate(payload);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Logoyu düzenle</DialogTitle>
          <DialogDescription>
            Logo bilgilerini ve görselini güncelleyin.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p className="text-muted-foreground">Yükleniyor...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="update-logo-file">Yeni Logo Görseli (opsiyonel)</Label>
              <Input
                id="update-logo-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={updateMutation.isPending}
              />
            </div>
            {previewSrc && (
              <div className="space-y-2">
                <Label>Kırpma (opsiyonel)</Label>
                <ImageEdit
                  ref={imageEditRef}
                  src={previewSrc}
                  aspectRatio={1}
                  maxWidth={512}
                  maxHeight={512}
                  onCropComplete={handleCropComplete}
                  showApplyButton={true}
                  disabled={updateMutation.isPending}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="update-logo-name">Ad</Label>
              <Input
                id="update-logo-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-logo-status">Durum</Label>
              <select
                id="update-logo-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "ACTIVE" | "PASSIVE")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                disabled={updateMutation.isPending}
              >
                <option value="ACTIVE">Aktif</option>
                <option value="PASSIVE">Pasif</option>
              </select>
            </div>
            {updateMutation.error && (
              <p className="text-sm text-destructive">{getErrorMessage(updateMutation.error)}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateMutation.isPending}
              >
                İptal
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
