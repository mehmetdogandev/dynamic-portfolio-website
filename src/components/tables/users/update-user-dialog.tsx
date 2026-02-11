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

type UpdateUserDialogProps = {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

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

function emptyUserInfo(): Record<string, string> {
  return {
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
  };
}

function userInfoToState(info: Record<string, unknown> | null): Record<string, string> {
  if (!info) return emptyUserInfo();
  const base = emptyUserInfo();
  for (const key of Object.keys(base)) {
    const v = info[key];
    base[key] = v != null ? String(v) : "";
  }
  return base;
}

export function UpdateUserDialog({
  userId,
  open,
  onOpenChange,
}: UpdateUserDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userInfo, setUserInfo] = useState<Record<string, string>>(emptyUserInfo);
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
  const apiUserInfo = user && "userInfo" in user ? user.userInfo : null;

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
    if (apiUserInfo && typeof apiUserInfo === "object") {
      setUserInfo(userInfoToState(apiUserInfo as Record<string, unknown>));
      const pic = (apiUserInfo as { profilePicture?: string }).profilePicture;
      if (pic) {
        const url = pic.startsWith("/") ? pic : `/${pic}`;
        setProfilePreview(url);
      }
    } else if (user && !apiUserInfo) {
      setUserInfo(emptyUserInfo());
      setProfilePreview(null);
    }
  }, [apiUserInfo, user]);

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
    if (apiUserInfo && typeof apiUserInfo === "object") {
      const pic = (apiUserInfo as { profilePicture?: string }).profilePicture;
      if (pic) {
        setProfilePreview(pic.startsWith("/") ? pic : `/${pic}`);
      } else {
        setProfilePreview(null);
      }
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
      lastName: userInfo.lastName ?? "",
      displayName: userInfo.displayName ?? "",
      phoneNumber: userInfo.phoneNumber ?? "",
      address: userInfo.address ?? "",
      city: userInfo.city ?? "",
      state: userInfo.state ?? "",
      zipCode: userInfo.zipCode ?? "",
      country: userInfo.country ?? "",
      bio: userInfo.bio ?? "",
      website: userInfo.website ?? "",
      ...Object.fromEntries(
        SOCIAL_FIELDS.map((f) => [f.key, userInfo[f.key] ?? ""])
      ),
    };
    updateMutation.mutate({
      id: userId,
      name,
      email,
      profilePhotoBase64,
      profilePhotoMimeType,
      userInfo: ui,
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
                {(profileFile || (profilePreview && !(apiUserInfo as { profilePicture?: string })?.profilePicture)) && (
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

            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Temel bilgiler</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
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
                  <Label htmlFor="update-lastName">Soyad</Label>
                  <Input
                    id="update-lastName"
                    value={userInfo.lastName}
                    onChange={(e) => setUserInfoField("lastName", e.target.value)}
                    disabled={updateMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="update-displayName">Görünen ad</Label>
                  <Input
                    id="update-displayName"
                    value={userInfo.displayName}
                    onChange={(e) => setUserInfoField("displayName", e.target.value)}
                    disabled={updateMutation.isPending}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
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
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="update-phoneNumber">Telefon</Label>
                  <Input
                    id="update-phoneNumber"
                    value={userInfo.phoneNumber}
                    onChange={(e) => setUserInfoField("phoneNumber", e.target.value)}
                    disabled={updateMutation.isPending}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Adres</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="update-address">Adres</Label>
                  <Input
                    id="update-address"
                    value={userInfo.address}
                    onChange={(e) => setUserInfoField("address", e.target.value)}
                    disabled={updateMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="update-city">Şehir</Label>
                  <Input
                    id="update-city"
                    value={userInfo.city}
                    onChange={(e) => setUserInfoField("city", e.target.value)}
                    disabled={updateMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="update-state">İl / Eyalet</Label>
                  <Input
                    id="update-state"
                    value={userInfo.state}
                    onChange={(e) => setUserInfoField("state", e.target.value)}
                    disabled={updateMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="update-zipCode">Posta kodu</Label>
                  <Input
                    id="update-zipCode"
                    value={userInfo.zipCode}
                    onChange={(e) => setUserInfoField("zipCode", e.target.value)}
                    disabled={updateMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="update-country">Ülke</Label>
                  <Input
                    id="update-country"
                    value={userInfo.country}
                    onChange={(e) => setUserInfoField("country", e.target.value)}
                    disabled={updateMutation.isPending}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Diğer</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="update-bio">Bio</Label>
                  <Input
                    id="update-bio"
                    value={userInfo.bio}
                    onChange={(e) => setUserInfoField("bio", e.target.value)}
                    disabled={updateMutation.isPending}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="update-website">Web sitesi</Label>
                  <Input
                    id="update-website"
                    type="url"
                    value={userInfo.website}
                    onChange={(e) => setUserInfoField("website", e.target.value)}
                    disabled={updateMutation.isPending}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Sosyal / Medya</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {SOCIAL_FIELDS.map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`update-${key}`}>{label}</Label>
                    <Input
                      id={`update-${key}`}
                      value={userInfo[key] ?? ""}
                      onChange={(e) => setUserInfoField(key, e.target.value)}
                      disabled={updateMutation.isPending}
                    />
                  </div>
                ))}
              </div>
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
