'use client'

import { useState, useRef, useEffect } from 'react'
import { useTRPC } from '@/lib/trpc/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Mail,
  Shield,
  Calendar,
  Camera,
  Upload,
  Loader2,
  Trash2,
  KeyRound,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { CameraCaptureDialog } from '@/components/ui/camera-capture-dialog'
import { ProfilePhotoEditor } from '@/components/ui/profile-photo-editor'
import { translateScope } from '@/lib/i18n/db-enum-translations'
import { getUserDisplayInitials } from '@/lib/utils/user-initials'
import { motion } from 'framer-motion'
import { AccountPasswordPanel } from '@/components/settings/account-password-panel'
import { AccountSessionsPanel } from '@/components/settings/account-sessions-panel'

export function AccountProfileSection() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data: user, isLoading: userLoading } = useQuery({
    ...trpc.user.me.queryOptions(),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

  const [profilePhotoDialogOpen, setProfilePhotoDialogOpen] = useState(false)
  const [deletePhotoDialogOpen, setDeletePhotoDialogOpen] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false)
  const [editorDialogOpen, setEditorDialogOpen] = useState(false)
  const [editorImageSrc, setEditorImageSrc] = useState<string | null>(null)
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false)
  const [sessionsDialogOpen, setSessionsDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)

  useEffect(() => {
    const applyHash = () => {
      const id = window.location.hash.slice(1)
      if (id === 'ayarlar') {
        setPasswordDialogOpen(true)
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}`
        )
      } else if (id === 'oturumlar') {
        setSessionsDialogOpen(true)
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}`
        )
      }
    }
    applyHash()
    window.addEventListener('hashchange', applyHash)
    return () => window.removeEventListener('hashchange', applyHash)
  }, [])

  const {
    data: profilePhotoUrl,
    isLoading: profilePhotoLoading,
    refetch: refetchProfilePhoto,
  } = useQuery({
    ...trpc.user.getProfilePhotoUrl.queryOptions({
      userId: user?.id,
      fileId: user?.image || undefined,
    }),
    enabled: !!user?.id && !!user?.image,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

  useEffect(() => {
    if (user?.id && user?.image) {
      refetchProfilePhoto()
    }
  }, [user?.image, user?.id, refetchProfilePhoto])

  const generateUploadUrlMutation = useMutation(
    trpc.user.generateProfilePhotoUploadUrl.mutationOptions()
  )
  const updateProfilePhotoMutation = useMutation(
    trpc.user.updateProfilePhoto.mutationOptions({
      onSuccess: async () => {
        queryClient.invalidateQueries({
          queryKey: trpc.user.me.queryKey(),
        })

        toast.success('Profil fotoğrafı başarıyla güncellendi')
        setProfilePhotoDialogOpen(false)
        setUploadProgress(0)
      },
    })
  )
  const deleteProfilePhotoMutation = useMutation(
    trpc.user.deleteProfilePhoto.mutationOptions({
      onSuccess: async () => {
        queryClient.invalidateQueries({
          queryKey: trpc.user.me.queryKey(),
        })

        toast.success('Profil fotoğrafı başarıyla kaldırıldı')
        setProfilePhotoDialogOpen(false)
      },
    })
  )

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen bir resim dosyası seçin')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dosya boyutu 5MB'dan büyük olamaz")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const imageSrc = reader.result as string
      setEditorImageSrc(imageSrc)
      setEditorDialogOpen(true)
      setProfilePhotoDialogOpen(false)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async (croppedImageBlob: Blob) => {
    if (!user?.id) return

    try {
      setIsUploading(true)
      setUploadProgress(0)

      const croppedFile = new File(
        [croppedImageBlob],
        `profile-${Date.now()}.jpg`,
        {
          type: 'image/jpeg',
          lastModified: Date.now(),
        }
      )

      const { uploadUrl, filePath } =
        await generateUploadUrlMutation.mutateAsync({
          fileName: croppedFile.name,
          mimeType: croppedFile.type,
          fileSize: croppedFile.size,
          userId: user.id,
        })

      const formData = new FormData()
      formData.append('file', croppedFile)
      formData.append('fileName', croppedFile.name)
      formData.append('filePath', filePath)
      formData.append('prefix', 'profile')

      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100
          setUploadProgress(percentComplete)
        }
      })

      await new Promise<void>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'))
        })

        xhr.open('POST', uploadUrl)
        xhr.send(formData)
      })

      const response = JSON.parse(xhr.responseText)
      const fileId = response.fileId

      await updateProfilePhotoMutation.mutateAsync({
        fileId,
        userId: user.id,
      })
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Profil fotoğrafı yüklenirken bir hata oluştu'
      )
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleEditorSave = async (croppedImageBlob: Blob) => {
    await handleUpload(croppedImageBlob)
    setEditorDialogOpen(false)
    setEditorImageSrc(null)
  }

  const { data: userWithRoles, isLoading: userWithRolesLoading } = useQuery({
    ...trpc.user.getById.queryOptions({ id: user?.id || '' }),
    enabled: !!user?.id,
  })

  const roles = userWithRoles?.roles || []
  const rolesLoading = userWithRolesLoading

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '-'
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date))
  }

  if (userLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/30">
        <div className="h-48 animate-pulse bg-muted md:h-40" />
        <div className="space-y-4 p-6">
          <div className="h-6 w-2/3 max-w-xs animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-8">
        <p className="text-sm text-muted-foreground">
          Kullanıcı bilgileri yüklenemedi
        </p>
      </div>
    )
  }

  return (
    <>
      <motion.section
        id="profil"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="scroll-mt-28 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm dark:bg-card/40"
      >
        <div className="border-b border-border/60 bg-muted/30 px-6 py-5 md:px-8 md:py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Profil
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Kimlik bilgileri</p>
        </div>

        <div className="flex flex-col gap-8 p-6 md:flex-row md:items-start md:gap-10 md:p-8">
          <div className="relative mx-auto shrink-0 md:mx-0">
            <Avatar className="h-32 w-32 border-2 border-border shadow-md ring-4 ring-background md:h-36 md:w-36">
              {user?.image &&
              profilePhotoUrl?.downloadUrl &&
              !profilePhotoLoading ? (
                <AvatarImage
                  src={profilePhotoUrl.downloadUrl}
                  alt=""
                  className="object-cover"
                  onError={() => {
                    console.error('Failed to load profile photo')
                  }}
                />
              ) : null}
              <AvatarFallback className="text-xl font-semibold bg-primary text-primary-foreground md:text-2xl">
                {getUserDisplayInitials(user?.name, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full border-2 border-background shadow-md"
              onClick={() => setProfilePhotoDialogOpen(true)}
              aria-label="Profil fotoğrafını değiştir"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>

          <div className="min-w-0 flex-1 space-y-6">
            <div className="space-y-4">
              <div className="min-w-0">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  {user.name} {user.lastName || ''}
                </h2>
                {user.displayUsername ? (
                  <p className="mt-1 font-mono text-sm text-muted-foreground">
                    @{user.username}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto min-h-10 justify-start gap-2.5 border-border bg-background/80 py-2.5 text-left shadow-sm transition-colors hover:bg-muted/50"
                  onClick={() => setRolesDialogOpen(true)}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                    <Shield className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </span>
                  <span className="text-xs font-medium leading-snug sm:text-[13px]">
                    Yetkileri görüntüle
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto min-h-10 justify-start gap-2.5 border-border bg-background/80 py-2.5 text-left shadow-sm transition-colors hover:bg-muted/50"
                  onClick={() => setSessionsDialogOpen(true)}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10">
                    <KeyRound className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  </span>
                  <span className="text-xs font-medium leading-snug sm:text-[13px]">
                    Aktif oturumları görüntüle
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto min-h-10 justify-start gap-2.5 border-border bg-background/80 py-2.5 text-left shadow-sm transition-colors hover:bg-muted/50"
                  onClick={() => setPasswordDialogOpen(true)}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </span>
                  <span className="text-xs font-medium leading-snug sm:text-[13px]">
                    Şifre yenileme
                  </span>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/50 bg-background/60 px-4 py-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-[11px] font-medium uppercase tracking-wide">
                    E-posta
                  </span>
                </div>
                <p className="mt-1.5 break-all text-sm font-medium leading-snug">
                  {user.email}
                </p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/60 px-4 py-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-[11px] font-medium uppercase tracking-wide">
                    Kayıt
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-medium tabular-nums">
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <Dialog open={rolesDialogOpen} onOpenChange={setRolesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-3 border-b border-border/50 pb-4 text-left">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/15">
                <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="min-w-0 space-y-1">
                <DialogTitle className="text-lg">
                  Roller ve yetkiler
                </DialogTitle>
                <DialogDescription>
                  Hesabınıza tanımlı roller ve erişim kapsamları
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="mt-4 min-h-[4rem] rounded-xl border border-border/50 bg-muted/20 p-4">
            {rolesLoading ? (
              <div className="flex flex-wrap gap-2">
                <div className="h-7 w-24 animate-pulse rounded-full bg-muted" />
                <div className="h-7 w-32 animate-pulse rounded-full bg-muted" />
              </div>
            ) : roles && roles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <Badge
                    key={role.id}
                    variant="secondary"
                    className="border border-border/60 bg-background/90 px-3 py-1 font-normal"
                  >
                    {role.name}
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      · {translateScope(role.scope)}
                    </span>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Henüz atanmış rol bulunmuyor
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={sessionsDialogOpen} onOpenChange={setSessionsDialogOpen}>
        <DialogContent className="max-h-[min(90vh,calc(100vh-4rem))] gap-0 overflow-y-auto sm:max-w-xl">
          <DialogHeader className="space-y-3 border-b border-border/50 pb-4 text-left">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 ring-1 ring-sky-500/15">
                <KeyRound className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="min-w-0 space-y-1">
                <DialogTitle className="text-lg">Aktif oturumlar</DialogTitle>
                <DialogDescription>
                  Bu hesapta açık tarayıcı ve uygulama oturumları
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="pt-4">
            <AccountSessionsPanel />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="max-h-[min(90vh,calc(100vh-4rem))] gap-0 overflow-y-auto sm:max-w-md">
          <DialogHeader className="space-y-3 border-b border-border/50 pb-4 text-left">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/15">
                <Lock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 space-y-1">
                <DialogTitle className="text-lg">Şifre yenileme</DialogTitle>
                <DialogDescription>
                  Güvenliğiniz için güçlü bir şifre kullanın; güncelleme sonrası
                  diğer oturumlar kapanır
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="pt-4">
            <AccountPasswordPanel
              onSuccess={() => setPasswordDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={profilePhotoDialogOpen}
        onOpenChange={setProfilePhotoDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profil Fotoğrafı Güncelle</DialogTitle>
            <DialogDescription>
              Profil fotoğrafınızı yükleyin veya güncelleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center bg-muted">
                <Camera className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleFileSelect(file)
                }
              }}
              disabled={isUploading}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Fotoğraf Seç
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCameraDialogOpen(true)}
                disabled={isUploading}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                Kameradan Çek
              </Button>
            </div>
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <div className="flex-1 bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${uploadProgress}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground text-center">
              JPEG, PNG, WebP veya GIF (Max 5MB)
            </p>
            {user?.image &&
            profilePhotoUrl?.downloadUrl &&
            !profilePhotoLoading ? (
              <div className="pt-2 border-t">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    setProfilePhotoDialogOpen(false)
                    setDeletePhotoDialogOpen(true)
                  }}
                  disabled={isUploading || deleteProfilePhotoMutation.isPending}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2 " />
                  Profil Fotoğrafını Kaldır
                </Button>
              </div>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setProfilePhotoDialogOpen(false)
                }}
                disabled={isUploading || deleteProfilePhotoMutation.isPending}
              >
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <CameraCaptureDialog
        open={cameraDialogOpen}
        onOpenChange={setCameraDialogOpen}
        onCapture={(file) => {
          handleFileSelect(file)
        }}
      />
      {editorImageSrc && (
        <ProfilePhotoEditor
          open={editorDialogOpen}
          onOpenChange={(open) => {
            setEditorDialogOpen(open)
            if (!open) {
              setEditorImageSrc(null)
            }
          }}
          imageSrc={editorImageSrc}
          onSave={handleEditorSave}
          aspect={1}
          minZoom={1}
          maxZoom={3}
        />
      )}
      <Dialog
        open={deletePhotoDialogOpen}
        onOpenChange={setDeletePhotoDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profil Fotoğrafını Kaldır</DialogTitle>
            <DialogDescription>
              Profil fotoğrafınızı kaldırmak istediğinize emin misiniz? Bu işlem
              geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletePhotoDialogOpen(false)}
              disabled={deleteProfilePhotoMutation.isPending}
            >
              İptal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                try {
                  await deleteProfilePhotoMutation.mutateAsync({
                    userId: user?.id || '',
                  })
                  setDeletePhotoDialogOpen(false)
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : 'Profil fotoğrafı kaldırılırken bir hata oluştu'
                  )
                }
              }}
              disabled={deleteProfilePhotoMutation.isPending}
            >
              {deleteProfilePhotoMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Kaldırılıyor...
                </>
              ) : (
                'Kaldır'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
