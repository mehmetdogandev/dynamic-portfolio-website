"use client";

import Image from "next/image";
import { useState } from "react";
import { authClient } from "@/lib/better-auth/client";
import { api } from "@/lib/trpc/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ImageEdit } from "@/components/ui/image-edit";
import { getAvatarUrl } from "@/lib/utils/avatar";

export default function SettingsPage() {
  const { data: session } = authClient.useSession();
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const utils = api.useUtils();
  const updatePhotoMutation = api.profile.updateMyPhoto.useMutation({
    onSuccess: () => {
      void utils.profile.getMyRoles.invalidate();
      setPreviewSrc(null);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (base64: string, mimeType: string) => {
    updatePhotoMutation.mutate({ imageBase64: base64, mimeType });
  };

  if (!session?.user) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <p className="text-muted-foreground">Giriş yapmanız gerekiyor.</p>
      </div>
    );
  }

  const currentAvatarUrl = getAvatarUrl(session.user.image);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Ayarlar</h1>
        <p className="text-muted-foreground">
          Profil ve hesap ayarlarınızı yönetin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil Fotoğrafı</CardTitle>
          <CardDescription>
            Profil fotoğrafınızı yükleyebilir ve boyutlarını düzenleyebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-6">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full">
              {previewSrc ? (
                <Image
                  src={previewSrc}
                  alt="Önizleme"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : currentAvatarUrl ? (
                <Image
                  src={currentAvatarUrl}
                  alt={session.user.name ?? ""}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-2xl font-medium text-muted-foreground">
                  {session.user.name?.slice(0, 2).toUpperCase() ?? "?"}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="profile-photo">Yeni fotoğraf seç</Label>
              <input
                id="profile-photo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground"
                disabled={updatePhotoMutation.isPending}
              />
            </div>
          </div>
          {previewSrc && (
            <div className="space-y-2">
              <Label>Kırpma ve boyut ayarı</Label>
              <ImageEdit
                src={previewSrc}
                aspectRatio={1}
                maxWidth={256}
                maxHeight={256}
                onCropComplete={handleCropComplete}
                showApplyButton={true}
                disabled={updatePhotoMutation.isPending}
              />
            </div>
          )}
          {updatePhotoMutation.error && (
            <p className="text-sm text-destructive">
              {updatePhotoMutation.error.message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
