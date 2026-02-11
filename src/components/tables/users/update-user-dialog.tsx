"use client";

import { useEffect, useRef, useState } from "react";
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
import { api } from "@/lib/trpc/react";
import { Camera, Upload, X } from "lucide-react";

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ base64: reader.result as string, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type UpdateUserDialogProps = {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UpdateUserDialog({
  userId,
  open,
  onOpenChange,
}: UpdateUserDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const { data: user, isLoading } = api.user.getById.useQuery(
    { id: userId },
    { enabled: open && !!userId }
  );
  const userInfo = user && "userInfo" in user ? user.userInfo : null;

  const utils = api.useUtils();
  const updateMutation = api.user.update.useMutation({
    onSuccess: () => {
      void utils.user.list.invalidate();
      void utils.user.getById.invalidate({ id: userId });
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (userInfo) {
      setDisplayName(userInfo.displayName ?? "");
      setPhoneNumber(userInfo.phoneNumber ?? "");
      setBio(userInfo.bio ?? "");
      setWebsite(userInfo.website ?? "");
      if (userInfo.profilePicture) {
        const url = userInfo.profilePicture.startsWith("/")
          ? userInfo.profilePicture
          : `/${userInfo.profilePicture}`;
        setProfilePreview(url);
      }
    } else if (user && !userInfo) {
      setDisplayName("");
      setPhoneNumber("");
      setBio("");
      setWebsite("");
      setProfilePreview(null);
    }
  }, [userInfo, user]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setProfileFile(file);
      setProfilePreview(URL.createObjectURL(file));
    }
    e.target.value = "";
  }

  function clearNewPhoto() {
    setProfileFile(null);
    if (userInfo?.profilePicture) {
      setProfilePreview(
        userInfo.profilePicture.startsWith("/")
          ? userInfo.profilePicture
          : `/${userInfo.profilePicture}`
      );
    } else {
      setProfilePreview(null);
    }
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      setCameraOpen(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera error:", err);
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  }

  function captureFromCamera() {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setProfileFile(new File([blob], "photo.jpg", { type: "image/jpeg" }));
        setProfilePreview(canvas.toDataURL("image/jpeg"));
        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let profilePhotoBase64: string | undefined;
    let profilePhotoMimeType: string | undefined;
    if (profileFile) {
      const { base64, mimeType } = await fileToBase64(profileFile);
      profilePhotoBase64 = base64;
      profilePhotoMimeType = mimeType;
    }
    updateMutation.mutate({
      id: userId,
      name,
      email,
      profilePhotoBase64,
      profilePhotoMimeType,
      userInfo: {
        displayName: displayName || undefined,
        phoneNumber: phoneNumber || undefined,
        bio: bio || undefined,
        website: website || undefined,
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kullanıcı Düzenle</DialogTitle>
          <DialogDescription>
            Kullanıcı ve profil bilgilerini güncelleyin.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p className="text-muted-foreground">Yükleniyor...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Profil fotoğrafı</Label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={updateMutation.isPending}
                >
                  <Upload className="mr-1 h-4 w-4" />
                  Dosya seç
                </Button>
                {!cameraOpen ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={startCamera}
                    disabled={updateMutation.isPending}
                  >
                    <Camera className="mr-1 h-4 w-4" />
                    Kamera ile çek
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={stopCamera}
                    disabled={updateMutation.isPending}
                  >
                    Kamerayı kapat
                  </Button>
                )}
                {(profileFile || (profilePreview && !userInfo?.profilePicture)) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearNewPhoto}
                    disabled={updateMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {cameraOpen && (
                <div className="space-y-2">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="max-h-40 rounded border bg-muted"
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={captureFromCamera}>
                    Fotoğraf çek
                  </Button>
                </div>
              )}
              {profilePreview && !cameraOpen && (
                <img
                  src={profilePreview}
                  alt="Önizleme"
                  className="h-24 w-24 rounded-full object-cover border"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-name">Ad Soyad</Label>
              <Input
                id="update-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-email">E-posta</Label>
              <Input
                id="update-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-displayName">Görünen ad</Label>
              <Input
                id="update-displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-phone">Telefon</Label>
              <Input
                id="update-phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-bio">Bio</Label>
              <Input
                id="update-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-website">Web sitesi</Label>
              <Input
                id="update-website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                disabled={updateMutation.isPending}
              />
            </div>
            {updateMutation.error && (
              <p className="text-sm text-destructive">{updateMutation.error.message}</p>
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
