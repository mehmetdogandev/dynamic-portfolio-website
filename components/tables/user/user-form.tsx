'use client'

import {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTRPC } from '@/lib/trpc/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usePermission } from '@/lib/hooks/use-rbac'
import { SCOPES, PERMISSIONS } from '@/lib/db/schema'
import { toast } from 'sonner'
import { Loader2, Upload, Camera, X, Eye, EyeOff } from 'lucide-react'
import { RoleSelector, type RoleOption } from '../role-selector'
import { AssignRoleGroup } from '../assign-role-group'
import { capitalizeWords } from '@/lib/utils'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../ui/accordion'
import { CameraCaptureDialog } from '../../ui/camera-capture-dialog'
import { ProfilePhotoEditor } from '../../ui/profile-photo-editor'
import { Dialog, DialogContent } from '../../ui/dialog'

// Form schema - updated to match TRPC schema
const createUserFormSchema = z.object({
  firstName: z.string().min(1, 'Ad gereklidir').max(50, 'Ad çok uzun'),
  lastName: z.string().min(1, 'Soyad gereklidir').max(50, 'Soyad çok uzun'),
  email: z.string().email('Geçerli bir e-posta adresi gereklidir'),
  username: z
    .string()
    .trim()
    .min(1, 'Kullanıcı adı gereklidir')
    .max(100, 'Kullanıcı adı en fazla 100 karakter olabilir'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  roleIds: z.array(z.string()),
})

const editUserFormSchema = z.object({
  firstName: z.string().min(1, 'Ad gereklidir').max(50, 'Ad çok uzun'),
  lastName: z.string().min(1, 'Soyad gereklidir').max(50, 'Soyad çok uzun'),
  email: z.string().email('Geçerli bir e-posta adresi gereklidir'),
  username: z
    .string()
    .trim()
    .min(1, 'Kullanıcı adı gereklidir')
    .max(100, 'Kullanıcı adı en fazla 100 karakter olabilir'),
  password: z
    .union([
      z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
      z.literal(''),
    ])
    .optional(),
  roleIds: z.array(z.string()),
})

type CreateUserFormValues = z.infer<typeof createUserFormSchema>
type EditUserFormValues = z.infer<typeof editUserFormSchema>

// Define the ref type for UserForm
export interface UserFormRef {
  uploadProfilePhoto: (userId: string) => Promise<void>
  getProfilePhotoFile: () => File | null
}

// Export the create form values type for use in dialogs
export type { CreateUserFormValues, EditUserFormValues }

interface UserFormProps {
  initialData?: Partial<CreateUserFormValues | EditUserFormValues> & {
    id?: string
    roles?: Array<{ id: string; name: string; scope: string }>
    email?: string
  }
  onSubmit: (data: CreateUserFormValues | EditUserFormValues) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
  isCreateMode?: boolean // To determine if password field should be shown
  userId?: string
}

export const UserForm = forwardRef<UserFormRef, UserFormProps>(
  (
    {
      initialData,
      onSubmit,
      isLoading = false,
      submitLabel = 'Kaydet',
      isCreateMode = false,
      userId,
    },
    ref
  ) => {
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
      initialData?.roleIds || initialData?.roles?.map((r) => r.id) || []
    )
    const [isSubmitting, setIsSubmitting] = useState(false)
    const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null)
    const [profilePhotoPreview, setProfilePhotoPreview] = useState<
      string | null
    >(null)
    const [profilePhotoUploadProgress, setProfilePhotoUploadProgress] =
      useState(0)
    const [isUploadingProfilePhoto, setIsUploadingProfilePhoto] =
      useState(false)
    const profilePhotoInputRef = useRef<HTMLInputElement | null>(null)
    const [cameraDialogOpen, setCameraDialogOpen] = useState(false)
    const [editorDialogOpen, setEditorDialogOpen] = useState(false)
    const [editorImageSrc, setEditorImageSrc] = useState<string | null>(null)
    const [shouldDeleteProfilePhoto, setShouldDeleteProfilePhoto] =
      useState(false)
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const trpc = useTRPC()
    const queryClient = useQueryClient()

    const { data: canSetOtherUserPassword } = usePermission(
      SCOPES.USER,
      PERMISSIONS.UPDATE
    )

    // Fetch all available roles
    const {
      data: rolesData,
      isLoading: isLoadingRoles,
      error: rolesError,
    } = useQuery({
      ...trpc.role.list.queryOptions({
        page: 1,
        limit: 10000, // Get all roles - very high limit to ensure we get everything
      }),
    })

    // Show error if roles failed to load
    useEffect(() => {
      if (rolesError) {
        toast.error(`Roller yüklenirken hata: ${rolesError.message}`)
      }
    }, [rolesError])

    const form = useForm<CreateUserFormValues | EditUserFormValues>({
      resolver: zodResolver(
        isCreateMode ? createUserFormSchema : editUserFormSchema
      ),
      defaultValues: {
        firstName: initialData?.firstName || '',
        lastName: initialData?.lastName || '',
        email: (initialData as { email?: string })?.email || '',
        username: initialData?.username || '',
        ...(isCreateMode && { password: '' }),
        ...(!isCreateMode && { password: '' }),
        roleIds: selectedRoleIds,
      } as CreateUserFormValues | EditUserFormValues,
    })

    useEffect(() => {
      form.setValue('roleIds', selectedRoleIds)
    }, [selectedRoleIds, form])

    const { data: userDetails } = useQuery({
      ...trpc.user.getById.queryOptions({ id: userId || '' }),
      enabled: !isCreateMode && !!userId,
    })

    const userImageId = (userDetails as unknown as { image?: string })?.image
    const { data: profilePhotoUrl } = useQuery({
      ...trpc.user.getProfilePhotoUrl.queryOptions({
        userId: userId || '',
        fileId: userImageId || undefined,
      }),
      enabled: !isCreateMode && !!userId && !!userImageId,
    })

    useEffect(() => {
      if (
        !isCreateMode &&
        profilePhotoUrl?.downloadUrl &&
        !shouldDeleteProfilePhoto
      ) {
        if (profilePhotoPreview !== profilePhotoUrl.downloadUrl) {
          setProfilePhotoPreview(profilePhotoUrl.downloadUrl)
        }
      } else if (
        !isCreateMode &&
        !profilePhotoUrl?.downloadUrl &&
        !profilePhotoFile &&
        shouldDeleteProfilePhoto
      ) {
        setProfilePhotoPreview(null)
      }
    }, [
      profilePhotoUrl?.downloadUrl,
      isCreateMode,
      shouldDeleteProfilePhoto,
      profilePhotoFile,
      profilePhotoPreview,
    ])

    const generateProfilePhotoUploadUrlMutation = useMutation(
      trpc.user.generateProfilePhotoUploadUrl.mutationOptions()
    )
    const updateProfilePhotoMutation = useMutation(
      trpc.user.updateProfilePhoto.mutationOptions({
        onSuccess: async (_, variables) => {
          if (userId) {
            queryClient.invalidateQueries({
              queryKey: trpc.user.getById.queryKey({ id: userId }),
            })
            queryClient.invalidateQueries({
              queryKey: trpc.user.getProfilePhotoUrl.queryKey({
                userId,
                fileId: variables.fileId,
              }),
            })
            queryClient.invalidateQueries({
              predicate: (query) => {
                const key = query.queryKey
                return (
                  Array.isArray(key) &&
                  key[0]?.[0] === 'user' &&
                  key[0]?.[1] === 'getProfilePhotoUrl' &&
                  (key[0]?.[2] as { userId?: string })?.userId === userId
                )
              },
            })
          }
          queryClient.invalidateQueries({
            queryKey: trpc.user.list.queryKey(),
          })
          queryClient.invalidateQueries({
            queryKey: trpc.user.me.queryKey(),
          })
        },
      })
    )
    const deleteProfilePhotoMutation = useMutation(
      trpc.user.deleteProfilePhoto.mutationOptions()
    )

    const handleProfilePhotoSelect = async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Lütfen bir resim dosyası seçin')
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Dosya boyutu 5MB'dan büyük olamaz")
        return
      }

      // Open editor dialog with image
      const reader = new FileReader()
      reader.onloadend = () => {
        const imageSrc = reader.result as string
        setEditorImageSrc(imageSrc)
        setEditorDialogOpen(true)
      }
      reader.readAsDataURL(file)
    }

    const handleEditorSave = async (croppedImageBlob: Blob) => {
      const croppedFile = new File(
        [croppedImageBlob],
        `profile-${Date.now()}.jpg`,
        {
          type: 'image/jpeg',
          lastModified: Date.now(),
        }
      )

      setProfilePhotoFile(croppedFile)
      setShouldDeleteProfilePhoto(false)

      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setProfilePhotoPreview(reader.result)
        }
      }
      reader.readAsDataURL(croppedFile)

      setEditorDialogOpen(false)
      setEditorImageSrc(null)
    }

    const uploadProfilePhoto = async (userId: string) => {
      if (!profilePhotoFile) return

      try {
        setIsUploadingProfilePhoto(true)
        setProfilePhotoUploadProgress(0)

        const { uploadUrl, filePath } =
          await generateProfilePhotoUploadUrlMutation.mutateAsync({
            fileName: profilePhotoFile.name,
            mimeType: profilePhotoFile.type,
            fileSize: profilePhotoFile.size,
            userId,
          })

        const formData = new FormData()
        formData.append('file', profilePhotoFile)
        formData.append('fileName', profilePhotoFile.name)
        formData.append('filePath', filePath)
        formData.append('prefix', 'profile')

        const xhr = new XMLHttpRequest()
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100
            setProfilePhotoUploadProgress(percentComplete)
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

        // Get fileId from response
        const response = JSON.parse(xhr.responseText)
        const fileId = response.fileId

        await updateProfilePhotoMutation.mutateAsync({
          fileId,
          userId,
        })

        if (userId) {
          await queryClient.refetchQueries({
            queryKey: trpc.user.getById.queryKey({ id: userId }),
          })

          const newProfilePhotoUrl = await queryClient.fetchQuery({
            ...trpc.user.getProfilePhotoUrl.queryOptions({
              userId,
              fileId,
            }),
          })

          if (newProfilePhotoUrl?.downloadUrl) {
            setProfilePhotoPreview(newProfilePhotoUrl.downloadUrl)
          }
        }

        toast.success('Profil fotoğrafı başarıyla yüklendi')
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Profil fotoğrafı yüklenirken bir hata oluştu'
        )
      } finally {
        setIsUploadingProfilePhoto(false)
        setProfilePhotoUploadProgress(0)
      }
    }

    useImperativeHandle(ref, () => ({
      uploadProfilePhoto,
      getProfilePhotoFile: () => profilePhotoFile,
    }))

    const _handleRoleToggle = (roleId: string) => {
      const newRoleIds = selectedRoleIds.includes(roleId)
        ? selectedRoleIds.filter((id) => id !== roleId)
        : [...selectedRoleIds, roleId]

      setSelectedRoleIds(newRoleIds)
    }

    const availableRoles: RoleOption[] = (rolesData?.data || [])
      .filter((role) => role.id && role.name && role.scope)
      .map((role) => ({
        id: role.id!,
        name: role.name!,
        scope: role.scope!,
      }))

    const handleSubmit = async (
      data: CreateUserFormValues | EditUserFormValues
    ) => {
      if (isSubmitting || isLoading) {
        return // Prevent multiple submissions
      }

      // Clear any existing timeout
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current)
      }

      // Format firstName and lastName
      const formattedData = {
        ...data,
        firstName: capitalizeWords(data.firstName),
        lastName: capitalizeWords(data.lastName),
      }

      setIsSubmitting(true)

      try {
        await onSubmit(formattedData)

        if (shouldDeleteProfilePhoto && userId && !isCreateMode) {
          try {
            await deleteProfilePhotoMutation.mutateAsync({
              userId,
            })
            queryClient.invalidateQueries({
              queryKey: trpc.user.getById.queryKey({ id: userId }),
            })
            queryClient.invalidateQueries({
              queryKey: trpc.user.list.queryKey(),
            })
            toast.success('Profil fotoğrafı başarıyla kaldırıldı')
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : 'Profil fotoğrafı kaldırılırken bir hata oluştu'
            )
          }
        }

        if (profilePhotoFile && userId) {
          await uploadProfilePhoto(userId)
        }
      } catch (_error) {
      } finally {
        // Add a small delay to prevent rapid resubmissions
        submitTimeoutRef.current = setTimeout(() => {
          setIsSubmitting(false)
        }, 1000)
      }
    }

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (submitTimeoutRef.current) {
          clearTimeout(submitTimeoutRef.current)
        }
      }
    }, [])

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4 sm:space-y-6"
        >
          <Accordion type="multiple" defaultValue={['basic-info']}>
            {/* Basic Information */}
            <AccordionItem value="basic-info">
              <AccordionTrigger className="py-2 sm:py-3">
                <div className="text-base sm:text-lg flex items-center space-x-1.5 sm:space-x-2">
                  <span>Temel Bilgiler</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">
                          Ad <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="dark:bg-black h-9 sm:h-10 text-sm sm:text-base"
                            placeholder="Örn: Ahmet"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs sm:text-sm" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">
                          Soyad <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="dark:bg-black h-9 sm:h-10 text-sm sm:text-base"
                            placeholder="Örn: Yılmaz"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs sm:text-sm" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">
                          E-posta <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="dark:bg-black h-9 sm:h-10 text-sm sm:text-base"
                            type="email"
                            placeholder="Örn: ahmet@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs sm:text-sm"></FormDescription>
                        <FormMessage className="text-xs sm:text-sm" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">
                          Kullanıcı adı <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="dark:bg-black h-9 sm:h-10 text-sm sm:text-base"
                            placeholder="Örn: ahmet.yilmaz"
                            maxLength={100}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs sm:text-sm" />
                      </FormItem>
                    )}
                  />
                </div>

                {isCreateMode && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">
                          Şifre <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              className="dark:bg-black pr-8 sm:pr-10 h-9 sm:h-10 text-sm sm:text-base"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="En az 6 karakter"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 text-muted-foreground hover:text-foreground"
                              aria-label={
                                showPassword
                                  ? 'Şifreyi gizle'
                                  : 'Şifreyi göster'
                              }
                            >
                              {showPassword ? (
                                <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              ) : (
                                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs sm:text-sm">
                          Kullanıcının giriş şifresi (en az 6 karakter)
                        </FormDescription>
                        <FormMessage className="text-xs sm:text-sm" />
                      </FormItem>
                    )}
                  />
                )}

                {!isCreateMode && canSetOtherUserPassword && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">
                          Yeni Şifre
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              className="dark:bg-black pr-8 sm:pr-10 h-9 sm:h-10 text-sm sm:text-base"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Yeni şifre (boş bırakılırsa değiştirilmez)"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 text-muted-foreground hover:text-foreground"
                              aria-label={
                                showPassword
                                  ? 'Şifreyi gizle'
                                  : 'Şifreyi göster'
                              }
                            >
                              {showPassword ? (
                                <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              ) : (
                                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs sm:text-sm">
                          Kullanıcının şifresini değiştirmek için yeni şifre
                          girin. Boş bırakılırsa şifre değiştirilmez.
                        </FormDescription>
                        <FormMessage className="text-xs sm:text-sm" />
                      </FormItem>
                    )}
                  />
                )}

                {/* Profile Photo Upload */}
                {
                  <div className="space-y-2 border rounded-lg p-2 sm:p-4">
                    <FormLabel className="text-sm sm:text-base">
                      Profil Fotoğrafı
                    </FormLabel>
                    <div className="flex items-center gap-2 sm:gap-4">
                      {profilePhotoPreview ? (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setPreviewDialogOpen(true)}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            <img
                              src={profilePhotoPreview}
                              alt="Profile preview"
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2"
                            />
                          </button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute -top-2 -right-2 h-5 w-5 sm:h-6 sm:w-6 rounded-full p-0 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                              setProfilePhotoFile(null)
                              setProfilePhotoPreview(null)
                              setShouldDeleteProfilePhoto(true)
                              if (profilePhotoInputRef.current) {
                                profilePhotoInputRef.current.value = ''
                              }
                            }}
                          >
                            <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed flex items-center justify-center bg-muted">
                          <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 space-y-1.5 sm:space-y-2">
                        <input
                          ref={profilePhotoInputRef}
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleProfilePhotoSelect(file)
                            }
                          }}
                          disabled={isUploadingProfilePhoto}
                        />
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              profilePhotoInputRef.current?.click()
                            }
                            disabled={isUploadingProfilePhoto}
                            className="h-7 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
                          >
                            <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            {profilePhotoFile ? 'Değiştir' : 'Fotoğraf Seç'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setCameraDialogOpen(true)}
                            disabled={isUploadingProfilePhoto}
                            className="h-7 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
                          >
                            <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-0" />
                            <span className="hidden sm:inline">
                              Kameradan Çek
                            </span>
                            <span className="sm:hidden">Kamera</span>
                          </Button>
                          {isUploadingProfilePhoto && (
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-1">
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-muted-foreground" />
                              <div className="flex-1 bg-secondary rounded-full h-1.5 sm:h-2">
                                <div
                                  className="bg-primary h-1.5 sm:h-2 rounded-full transition-all"
                                  style={{
                                    width: `${profilePhotoUploadProgress}%`,
                                  }}
                                />
                              </div>
                              <span className="text-[10px] sm:text-xs text-muted-foreground">
                                {Math.round(profilePhotoUploadProgress)}%
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          JPEG, PNG, WebP veya GIF (Max 5MB)
                        </p>
                      </div>
                    </div>
                  </div>
                }
              </AccordionContent>
            </AccordionItem>

            {/* Role Groups (sibling accordion item) - only show when editing an existing user */}
            {initialData?.id && (
              <AccordionItem value="role-groups">
                <AccordionTrigger className="py-2 sm:py-3">
                  <div className="text-base sm:text-lg flex items-center space-x-1.5 sm:space-x-2">
                    <span>Rol Grupları</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 sm:pt-4 pb-4 sm:pb-6">
                  <AssignRoleGroup userId={initialData.id} />
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Role Assignment */}
            <AccordionItem value="role-assignment">
              <AccordionTrigger className="py-2 sm:py-3">
                <div className="text-base sm:text-lg flex items-center space-x-1.5 sm:space-x-2">
                  <span>Rol Atamaları</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 sm:pt-4 pb-4 sm:pb-6">
                <FormField
                  control={form.control}
                  name="roleIds"
                  render={() => (
                    <FormItem>
                      {isLoadingRoles ? (
                        <div className="flex items-center justify-center py-6 sm:py-8">
                          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-muted-foreground" />
                          <span className="ml-2 text-xs sm:text-sm text-muted-foreground">
                            Roller yükleniyor...
                          </span>
                        </div>
                      ) : (
                        <RoleSelector
                          selectedRoleIds={selectedRoleIds}
                          onSelectionChange={setSelectedRoleIds}
                          availableRoles={availableRoles}
                          placeholder="Rol ara ve seç..."
                          label="Kullanıcı Rolleri"
                          description={`Bu kullanıcıya atanacak rolleri seçin (${selectedRoleIds.length} rol seçildi)`}
                          alwaysOpen={true}
                        />
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="flex justify-end space-x-2 pt-2 sm:pt-0">
            <Button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="h-9 px-4 text-sm sm:h-10 sm:px-6 sm:text-base"
            >
              {(isLoading || isSubmitting) && (
                <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
              )}
              {submitLabel}
            </Button>
          </div>
        </form>
        <CameraCaptureDialog
          open={cameraDialogOpen}
          onOpenChange={setCameraDialogOpen}
          onCapture={(file) => {
            handleProfilePhotoSelect(file)
          }}
        />
        {editorImageSrc && (
          <ProfilePhotoEditor
            open={editorDialogOpen}
            onOpenChange={setEditorDialogOpen}
            imageSrc={editorImageSrc}
            onSave={handleEditorSave}
            aspect={1}
          />
        )}
        {profilePhotoPreview && (
          <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
            <DialogContent className=" p-0">
              <div className="flex items-center justify-center p-4">
                <img
                  src={profilePhotoPreview}
                  alt="Profile preview"
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </Form>
    )
  }
)

UserForm.displayName = 'UserForm'
