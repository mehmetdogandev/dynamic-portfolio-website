'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2, Users, Shield } from 'lucide-react'
// accordion grouping removed — roles are listed flat now
// ScrollArea used by selector component when needed
import { RoleSelectorDataTable } from './role-selector-data-table'
import type { Role } from '@/lib/db/schema/rbac'

// Form schema
const roleGroupFormSchema = z.object({
  title: z.string().min(1, 'Title gereklidir').max(100, 'Title çok uzun'),
  description: z.string().optional(),
  roleIds: z.array(z.string()).min(1, 'En az bir rol seçilmelidir'),
})

export type RoleGroupFormValues = z.infer<typeof roleGroupFormSchema>

interface RoleGroupFormProps {
  initialData?: Partial<RoleGroupFormValues> & { id?: string }
  availableRoles: Role[]
  onSubmit: (data: RoleGroupFormValues) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
}

export function RoleGroupForm({
  initialData,
  availableRoles,
  onSubmit,
  isLoading = false,
  submitLabel = 'Kaydet',
}: RoleGroupFormProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    initialData?.roleIds || []
  )

  const getDefaultValues = useCallback(
    () => ({
      title: initialData?.title || '',
      description: initialData?.description || '',
      roleIds: initialData?.roleIds || [],
    }),
    [initialData]
  )

  const form = useForm<RoleGroupFormValues>({
    resolver: zodResolver(roleGroupFormSchema),
    defaultValues: getDefaultValues(),
  })
  // Reset form and state when initial data changes
  useEffect(() => {
    if (initialData) {
      const newDefaults = getDefaultValues()
      form.reset(newDefaults)
      setSelectedRoles(initialData.roleIds || [])
    }
  }, [initialData, form, getDefaultValues])

  // Selection is handled by the server-side `RoleSelectorDataTable` via `onChange`.

  // NOTE: role listing moved to server-side paginated selector component

  const getSelectedRolesByScope = () => {
    const selectedRoleObjects = availableRoles.filter((role) =>
      selectedRoles.includes(role.id)
    )

    const rolesByScope: Record<string, Role[]> = {}
    selectedRoleObjects.forEach((role) => {
      if (!rolesByScope[role.scope]) {
        rolesByScope[role.scope] = []
      }
      rolesByScope[role.scope].push(role)
    })

    return rolesByScope
  }

  const selectedRolesByScope = getSelectedRolesByScope()

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-2 sm:space-y-6 min-w-0 max-w-full"
      >
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Users className="h-3 w-3 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-md">Temel Bilgiler</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-base">
                    Title / Unvan
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="dark:bg-black text-xs sm:text-base"
                      placeholder="Örn: Departman Müdürü, Çözüm Lideri, Uzman"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs sm:text-base">
                    Bu rol grubunu tanımlayan title/unvan adı
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-base">
                    Açıklama (Opsiyonel)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[80px] dark:bg-black text-xs sm:text-base"
                      placeholder="Bu rol grubunun sorumluluklarını ve yetkilerini açıklayın..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs sm:text-base">
                    Rol grubunun detaylı açıklaması
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Role Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-1 md:space-x-3">
                <Shield className="h-3 w-3 mt-1.5 sm:h-5 sm:w-5" />
                <div>
                  <div className=" text-md md:text-lg font-medium">Roller</div>
                  <div className="text-xs text-muted-foreground sm:text-sm md:text-base ">
                    {selectedRoles.length} seçili
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="roleIds"
              render={() => (
                <FormItem>
                  <FormDescription className="mb-2 text-xs sm:text-sm ">
                    Bu rol grubuna dahil edilecek rolleri seçin.
                  </FormDescription>

                  {availableRoles.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Henüz hiç rol tanımlanmamış</p>
                      <p className="text-sm">
                        Önce roller oluşturun, sonra rol grupları
                        oluşturabilirsiniz
                      </p>
                    </div>
                  ) : (
                    <>
                      <RoleSelectorDataTable
                        selectedIds={selectedRoles}
                        onChange={(ids) => {
                          setSelectedRoles(ids)
                          form.setValue('roleIds', ids)
                        }}
                        pageSize={10}
                      />
                    </>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Selected Roles Summary */}
        {selectedRoles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xs sm:text-lg font-medium">
                Seçilen Roller Özeti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-4">
                {Object.entries(selectedRolesByScope).map(([scope, roles]) => (
                  <div key={scope}>
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
                      >
                        {scope}
                      </Badge>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {roles.length} rol
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1 sm:gap-2 ml-2 sm:ml-4">
                      {roles.map((role) => (
                        <div
                          key={role.id}
                          className="flex items-center justify-between p-1 sm:p-2 bg-muted/30 rounded-md"
                        >
                          <span className="text-xs sm:text-sm font-medium truncate">
                            {role.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 shrink-0 ml-1"
                          >
                            {role.permissions.length} izin
                          </Badge>
                        </div>
                      ))}
                    </div>
                    {scope !==
                      Object.keys(selectedRolesByScope)[
                        Object.keys(selectedRolesByScope).length - 1
                      ] && <Separator className="mt-2 sm:mt-4" />}
                  </div>
                ))}

                <div className="bg-blue-50 dark:bg-blue-950 p-2 sm:p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-[10px] sm:text-sm text-blue-800 dark:text-blue-200">
                    <strong>Toplam: </strong>
                    {selectedRoles.length} rol,{' '}
                    {Object.keys(selectedRolesByScope).length} farklı kapsam
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-2">
          <Button
            className="text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-3"
            type="submit"
            disabled={isLoading || selectedRoles.length === 0}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}
