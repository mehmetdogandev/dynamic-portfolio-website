// Role management types and schemas
import { z } from 'zod'
import { permissionEnum, scopesEnum, SCOPES } from '@/lib/db/schema/rbac'
import { SCOPE_TRANSLATIONS } from '@/lib/i18n/db-enum-translations'

export const roleFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Rol adı gereklidir')
    .max(100, 'Rol adı çok uzun')
    .regex(/^[a-zA-Z0-9\s\-_ğüşıöçĞÜŞIÖÇ]+$/, 'Geçersiz karakter'),
  scope: z.enum(scopesEnum.enumValues).refine((val) => val !== undefined, {
    message: 'Kapsam seçilmelidir',
  }),
  permissions: z
    .array(z.enum(permissionEnum.enumValues))
    .min(1, 'En az bir izin seçilmelidir'),
})

export const roleAssignmentSchema = z.object({
  userId: z.string(),
  roleGroupId: z.string(),
})

export interface EntityOption {
  id: string
  name: string
  parentId?: string
  level?: number
}

export type RoleFormData = z.infer<typeof roleFormSchema>
export type RoleAssignmentData = z.infer<typeof roleAssignmentSchema>

export interface BaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export interface RoleDialogProps extends BaseDialogProps {
  roleId?: string
  onSuccess?: () => void
}

export interface EntitySelectorProps {
  value: string[]
  onChange: (value: string[]) => void
  options: EntityOption[]
  placeholder?: string
  disabled?: boolean
  maxSelections?: number
}

export interface RoleTableActions {
  onEdit: (roleId: string) => void
  onDelete: (roleId: string) => void
  onAssignUsers: (roleId: string) => void
}

export const scopeLabels: Record<keyof typeof SCOPES, string> =
  SCOPE_TRANSLATIONS
