"use client";

import { useRef, useState } from "react";
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
import { getErrorMessage } from "@/lib/trpc/error-messages";
import { Camera, Upload, X } from "lucide-react";

const SOCIAL_FIELDS: Array<{ key: string; label: string }> = [
  { key: "twitter", label: "Twitter" },
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
  { key: "tiktok", label: "TikTok" },
  { key: "pinterest", label: "Pinterest" },
  { key: "reddit", label: "Reddit" },
  { key: "telegram", label: "Telegram" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "viber", label: "Viber" },
  { key: "skype", label: "Skype" },
  { key: "discord", label: "Discord" },
  { key: "twitch", label: "Twitch" },
  { key: "spotify", label: "Spotify" },
  { key: "appleMusic", label: "Apple Music" },
  { key: "amazonMusic", label: "Amazon Music" },
  { key: "deezer", label: "Deezer" },
  { key: "soundcloud", label: "SoundCloud" },
];

type CreateUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({ base64: result, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const emptyUserInfo = () => ({
  lastName: "",
  displayName: "",
  phoneNumber: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
  bio: "",
  website: "",
  ...Object.fromEntries(SOCIAL_FIELDS.map((f) => [f.key, ""])),
});

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userInfo, setUserInfo] = useState<Record<string, string>>(emptyUserInfo);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const utils = api.useUtils();
  const createMutation = api.user.create.useMutation({
    onSuccess: () => {
      void utils.user.list.invalidate();
      onOpenChange(false);
      setName("");
      setEmail("");
      setPassword("");
      setUserInfo(emptyUserInfo());
      setProfileFile(null);
      setProfilePreview(null);
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setProfileFile(file);
      const url = URL.createObjectURL(file);
      setProfilePreview(url);
    }
    e.target.value = "";
  }

  function clearProfilePhoto() {
    setProfileFile(null);
    if (profilePreview) URL.revokeObjectURL(profilePreview);
    setProfilePreview(null);
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
        const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
        setProfileFile(file);
        setProfilePreview(canvas.toDataURL("image/jpeg"));
        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  }

  function setUserInfoField(field: string, value: string) {
    setUserInfo((prev) => ({ ...prev, [field]: value }));
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
    const ui = {
      lastName: userInfo.lastName || "",
      displayName: userInfo.displayName || "",
      phoneNumber: userInfo.phoneNumber || "",
      address: userInfo.address || "",
      city: userInfo.city || "",
      state: userInfo.state || "",
      zipCode: userInfo.zipCode || "",
      country: userInfo.country || "",
      bio: userInfo.bio || undefined,
      website: userInfo.website || undefined,
      ...Object.fromEntries(
        SOCIAL_FIELDS.map((f) => [f.key, userInfo[f.key] || undefined])
      ),
    };
    createMutation.mutate({
      name,
      email,
      password: password || undefined,
      profilePhotoBase64,
      profilePhotoMimeType,
      userInfo: ui,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Kullanıcı</DialogTitle>
          <DialogDescription>
            Yeni kullanıcı bilgilerini girin. Profil fotoğrafı ve ek alanlar isteğe bağlıdır.
          </DialogDescription>
        </DialogHeader>
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
                disabled={createMutation.isPending}
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
                  disabled={createMutation.isPending}
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
                  disabled={createMutation.isPending}
                >
                  Kamerayı kapat
                </Button>
              )}
              {(profilePreview || cameraOpen) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (cameraOpen) stopCamera();
                    clearProfilePhoto();
                  }}
                  disabled={createMutation.isPending}
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

          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Temel bilgiler</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="create-name">Ad Soyad</Label>
                <Input
                  id="create-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-lastName">Soyad</Label>
                <Input
                  id="create-lastName"
                  value={userInfo.lastName}
                  onChange={(e) => setUserInfoField("lastName", e.target.value)}
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-displayName">Görünen ad</Label>
                <Input
                  id="create-displayName"
                  value={userInfo.displayName}
                  onChange={(e) => setUserInfoField("displayName", e.target.value)}
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="create-email">E-posta</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password">Şifre (opsiyonel)</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-phoneNumber">Telefon</Label>
                <Input
                  id="create-phoneNumber"
                  value={userInfo.phoneNumber}
                  onChange={(e) => setUserInfoField("phoneNumber", e.target.value)}
                  disabled={createMutation.isPending}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Adres</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="create-address">Adres</Label>
                <Input
                  id="create-address"
                  value={userInfo.address}
                  onChange={(e) => setUserInfoField("address", e.target.value)}
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-city">Şehir</Label>
                <Input
                  id="create-city"
                  value={userInfo.city}
                  onChange={(e) => setUserInfoField("city", e.target.value)}
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-state">İl / Eyalet</Label>
                <Input
                  id="create-state"
                  value={userInfo.state}
                  onChange={(e) => setUserInfoField("state", e.target.value)}
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-zipCode">Posta kodu</Label>
                <Input
                  id="create-zipCode"
                  value={userInfo.zipCode}
                  onChange={(e) => setUserInfoField("zipCode", e.target.value)}
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-country">Ülke</Label>
                <Input
                  id="create-country"
                  value={userInfo.country}
                  onChange={(e) => setUserInfoField("country", e.target.value)}
                  disabled={createMutation.isPending}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Diğer</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="create-bio">Bio</Label>
                <Input
                  id="create-bio"
                  value={userInfo.bio}
                  onChange={(e) => setUserInfoField("bio", e.target.value)}
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="create-website">Web sitesi</Label>
                <Input
                  id="create-website"
                  type="url"
                  value={userInfo.website}
                  onChange={(e) => setUserInfoField("website", e.target.value)}
                  disabled={createMutation.isPending}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Sosyal / Medya</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {SOCIAL_FIELDS.map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={`create-${key}`}>{label}</Label>
                  <Input
                    id={`create-${key}`}
                    value={userInfo[key] ?? ""}
                    onChange={(e) => setUserInfoField(key, e.target.value)}
                    disabled={createMutation.isPending}
                  />
                </div>
              ))}
            </div>
          </div>

          {createMutation.error && (
            <p className="text-sm text-destructive">{getErrorMessage(createMutation.error)}</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              İptal
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
