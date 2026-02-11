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
import { Camera, Upload, X } from "lucide-react";

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

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let profilePhotoBase64: string | undefined;
    let profilePhotoMimeType: string | undefined;
    if (profileFile) {
      const { base64, mimeType } = await fileToBase64(profileFile);
      profilePhotoBase64 = base64;
      profilePhotoMimeType = mimeType;
    }
    createMutation.mutate({
      name,
      email,
      password: password || undefined,
      profilePhotoBase64,
      profilePhotoMimeType,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Kullanıcı</DialogTitle>
          <DialogDescription>
            Yeni kullanıcı bilgilerini girin. Profil fotoğrafı isteğe bağlıdır.
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
          <div className="space-y-2">
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
          {createMutation.error && (
            <p className="text-sm text-destructive">{createMutation.error.message}</p>
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
