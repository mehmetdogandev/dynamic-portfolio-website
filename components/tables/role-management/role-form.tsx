/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { type RoleFormData, roleFormSchema, scopeLabels } from './types'
import { PERMISSIONS } from '@/lib/db'

const permissionGroups = {
  basic: ['READ', 'ACCESS'] as const,
  modify: ['CREATE', 'UPDATE', 'DELETE'] as const,
  advanced: ['EXPORT', 'IMPORT', 'APPROVE', 'REJECT'] as const,
  admin: ['ARCHIVE'] as const,
}

const permissionGroupLabels: {
  [key in keyof typeof permissionGroups]: string
} = {
  basic: 'Temel',
  modify: 'Değiştirme',
  advanced: 'Gelişmiş',
  admin: 'Yönetici',
}

const permissionLabels: {
  [key in keyof typeof PERMISSIONS]: string
} = {
  CREATE: 'Oluştur',
  READ: 'Görüntüle',
  ACCESS: 'Erişim',
  UPDATE: 'Güncelle',
  DELETE: 'Sil',
  EXPORT: 'Dışa Aktar',
  IMPORT: 'İçe Aktar',
  APPROVE: 'Onayla',
  REJECT: 'Reddet',
  ARCHIVE: 'Arşivle',
}

interface RoleFormProps {
  initialData?: Partial<RoleFormData> & { id?: string }
  onSubmit: (data: RoleFormData) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
}

export function RoleForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitLabel = 'Kaydet',
}: RoleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [_submitError, setSubmitError] = useState<string | null>(null)

  const getDefaultValues = useCallback(
    () => ({
      name: initialData?.name || '',
      scope: initialData?.scope || 'USER',
      permissions: initialData?.permissions || [],
    }),
    [initialData]
  )

  const form = useForm({
    resolver: zodResolver(roleFormSchema) as any,
    defaultValues: getDefaultValues(),
  })

  useEffect(() => {
    form.reset(getDefaultValues())
  }, [initialData, form, getDefaultValues])

  const watchedPermissions = form.watch('permissions')

  const onFormSubmit = async (data: RoleFormData) => {
    try {
      setIsSubmitting(true)
      setSubmitError(null)
      await onSubmit(data)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Kaydetme işlemi başarısız'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePermissionToggle = (permission: string, checked: boolean) => {
    const currentPermissions = form.getValues('permissions')
    const newPermissions = checked
      ? [...currentPermissions, permission]
      : currentPermissions.filter((p) => p !== permission)

    form.setValue('permissions', newPermissions as any, {
      shouldValidate: true,
    })
  }

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onFormSubmit as any)}
          className="space-y-4"
        >
          <Card>
            <CardContent className="flex flex-col sm:flex-row gap-4 pt-6">
              <FormField
                control={form.control as any}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1 flex flex-col">
                    <FormLabel className="">Rol Adı *</FormLabel>
                    <FormControl>
                      <Input
                        className="dark:bg-black h-10"
                        placeholder="Örn: Admin, Editor, Viewer"
                        {...field}
                        disabled={isSubmitting || isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="scope"
                render={({ field }) => (
                  <FormItem className="flex-1 flex flex-col">
                    <FormLabel>Kapsam</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Kapsam seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(scopeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="">
              <CardTitle className="flex items-center justify-center gap-2 text-lg font-semibold">
                İzinler
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {Object.entries(permissionGroups).map(
                  ([groupKey, groupPermissions]) => {
                    return (
                      <div key={groupKey} className="space-y-2">
                        <h4 className="font-medium flex items-center pt-2 ttext-sm">
                          {
                            permissionGroupLabels[
                              groupKey as keyof typeof permissionGroupLabels
                            ]
                          }
                        </h4>
                        <div className="flex flex-wrap items-center gap-3">
                          {groupPermissions.map((permission) => (
                            <div
                              key={permission}
                              className="flex items-center space-x-2 shrink-0"
                            >
                              <Checkbox
                                checked={watchedPermissions.includes(
                                  permission as any
                                )}
                                onCheckedChange={(checked) =>
                                  handlePermissionToggle(
                                    permission,
                                    checked as boolean
                                  )
                                }
                                disabled={isLoading}
                              />
                              <label className="text-xs whitespace-nowrap">
                                {
                                  permissionLabels[
                                    permission as keyof typeof permissionLabels
                                  ]
                                }
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }
                )}
              </div>
              {form.formState.errors.permissions && (
                <p className="text-sm text-destructive mt-2">
                  {form.formState.errors.permissions.message}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-end pt-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
