"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, FileUp, Pencil } from "lucide-react";
import { authClient } from "@/lib/better-auth/client";
import { api } from "@/lib/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageEdit } from "@/components/ui/image-edit";
import { getAvatarUrl } from "@/lib/utils/avatar";

export default function SettingsPage() {
  const { data: session, refetch } = authClient.useSession();
  const router = useRouter();
  const [choiceDialogOpen, setChoiceDialogOpen] = useState(false);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [imageEditDialogOpen, setImageEditDialogOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Email change state
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);

  const utils = api.useUtils();
  const { data: emailCooldown } = api.profile.getChangeEmailCooldown.useQuery(
    undefined,
    { refetchInterval: (query) => (query.state.data?.retryAfterSeconds ? 2000 : false) }
  );

  useEffect(() => {
    if (emailCooldown?.retryAfterSeconds != null && emailCooldown.retryAfterSeconds > emailCountdown) {
      setEmailCountdown(emailCooldown.retryAfterSeconds);
    }
  }, [emailCooldown?.retryAfterSeconds, emailCountdown]);

  const isCountingDown = emailCountdown > 0;
  useEffect(() => {
    if (!isCountingDown) return;
    const id = setInterval(() => setEmailCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [isCountingDown]);
  const updatePhotoMutation = api.profile.updateMyPhoto.useMutation({
    onSuccess: async () => {
      await refetch();
      router.refresh();
      void utils.profile.getMyRoles.invalidate();
      setPreviewSrc(null);
      setImageEditDialogOpen(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewSrc(reader.result as string);
      setChoiceDialogOpen(false);
      setImageEditDialogOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  function openFilePicker() {
    setChoiceDialogOpen(false);
    fileInputRef.current?.click();
  }

  function openCamera() {
    setChoiceDialogOpen(false);
    setCameraDialogOpen(true);
  }

  useEffect(() => {
    if (!cameraDialogOpen) return;
    let mounted = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" } })
      .then((stream) => {
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(console.error);
    return () => {
      mounted = false;
      stopCamera();
    };
  }, [cameraDialogOpen]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function captureFromCamera() {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setPreviewSrc(canvas.toDataURL("image/jpeg"));
    stopCamera();
    setCameraDialogOpen(false);
    setImageEditDialogOpen(true);
  }

  function closeCameraDialog() {
    stopCamera();
    setCameraDialogOpen(false);
  }

  const handleCropComplete = (base64: string, mimeType: string) => {
    updatePhotoMutation.mutate({ imageBase64: base64, mimeType });
  };

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    if (newPassword !== newPasswordConfirm) {
      setPasswordError("Yeni şifreler eşleşmiyor.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Yeni şifre en az 8 karakter olmalıdır.");
      return;
    }
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: false,
    });
    if (error) {
      setPasswordError(error.message ?? "Şifre değiştirilemedi.");
      return;
    }
    setPasswordSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setNewPasswordConfirm("");
    router.refresh();
  }

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(false);
    if (!newEmail.trim()) return;
    const { error } = await authClient.changeEmail({
      newEmail: newEmail.trim(),
    });
    if (error) {
      setEmailError(error.message ?? "E-posta değiştirilemedi.");
      return;
    }
    setEmailSuccess(true);
    setNewEmail("");
    void utils.profile.getChangeEmailCooldown.invalidate();
    await refetch();
    router.refresh();
  }

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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Avatar Source Choice Dialog */}
      <Dialog open={choiceDialogOpen} onOpenChange={setChoiceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Profil fotoğrafı</DialogTitle>
            <DialogDescription>
              Fotoğrafı nasıl eklemek istiyorsunuz?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 py-4">
            <Button
              variant="outline"
              className="flex-1 flex-col gap-2 h-auto py-6"
              onClick={openCamera}
            >
              <Camera className="h-8 w-8" />
              Kamera ile çek
            </Button>
            <Button
              variant="outline"
              className="flex-1 flex-col gap-2 h-auto py-6"
              onClick={openFilePicker}
            >
              <FileUp className="h-8 w-8" />
              Dosyadan yükle
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Camera Capture Dialog */}
      <Dialog open={cameraDialogOpen} onOpenChange={(open) => !open && closeCameraDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Kamera ile fotoğraf çek</DialogTitle>
            <DialogDescription>
              Fotoğrafı çektikten sonra kırpma ekranına gideceksiniz.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-h-64 rounded-md border object-cover bg-muted"
            />
            <DialogFooter>
              <Button variant="outline" onClick={closeCameraDialog}>
                Kapat
              </Button>
              <Button onClick={captureFromCamera}>
                Fotoğraf çek
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Edit Dialog */}
      <Dialog open={imageEditDialogOpen} onOpenChange={setImageEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kırpma ve boyut ayarı</DialogTitle>
            <DialogDescription>
              Fotoğrafı kırpıp boyutlandırın ve uygulayın.
            </DialogDescription>
          </DialogHeader>
          {previewSrc && (
            <div className="space-y-4">
              <ImageEdit
                src={previewSrc}
                aspectRatio={1}
                maxWidth={256}
                maxHeight={256}
                onCropComplete={handleCropComplete}
                showApplyButton={true}
                disabled={updatePhotoMutation.isPending}
              />
              {updatePhotoMutation.error && (
                <p className="text-sm text-destructive">
                  {updatePhotoMutation.error.message}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Profil Fotoğrafı Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profil Fotoğrafı</CardTitle>
          <CardDescription>
            Avatarınızın sol altındaki kalem ikonuna tıklayarak fotoğraf yükleyebilir veya kameradan çekebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative inline-block">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full">
              {currentAvatarUrl ? (
                <Image
                  src={currentAvatarUrl}
                  alt={session.user.name ?? ""}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-3xl font-medium text-muted-foreground">
                  {session.user.name?.slice(0, 2).toUpperCase() ?? "?"}
                </div>
              )}
            </div>
            <button
              type="button"
              className="absolute bottom-0 left-0 rounded-full bg-primary p-2 text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
              onClick={() => setChoiceDialogOpen(true)}
              aria-label="Profil fotoğrafını düzenle"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* E-posta Değiştir Card */}
      <Card>
        <CardHeader>
          <CardTitle>E-posta Adresi</CardTitle>
          <CardDescription>
            Hesabınızın e-posta adresini değiştirin. Yeni e-posta adresine doğrulama linki gönderilecektir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-email">Mevcut e-posta</Label>
              <Input
                id="current-email"
                type="email"
                value={session.user.email ?? ""}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">Yeni e-posta</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="yeni@ornek.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            {emailSuccess && <p className="text-sm text-green-600">Doğrulama e-postası gönderildi.</p>}
            <Button
              type="submit"
              disabled={
                emailCooldown !== undefined &&
                (!emailCooldown.canSend || emailCountdown > 0)
              }
            >
              {emailCountdown > 0
                ? `${emailCountdown} saniye sonra tekrar deneyebilirsiniz`
                : "E-posta Değiştir"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Şifre Değiştir Card */}
      <Card>
        <CardHeader>
          <CardTitle>Şifre Değiştir</CardTitle>
          <CardDescription>
            Hesabınızın şifresini güvenli bir şekilde değiştirin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Mevcut şifre</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Yeni şifre</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password-confirm">Yeni şifre (tekrar)</Label>
              <Input
                id="new-password-confirm"
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                required
                minLength={8}
              />
            </div>
            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            {passwordSuccess && <p className="text-sm text-green-600">Şifre başarıyla değiştirildi.</p>}
            <Button type="submit">Şifre Değiştir</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
