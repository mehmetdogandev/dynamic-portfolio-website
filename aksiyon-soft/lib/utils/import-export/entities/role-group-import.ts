import { z } from 'zod'
import type { ImportSchema } from '../types'

const roleGroupImportRowSchema = z.object({
  title: z.string().min(1, 'Başlık gerekli'),
  description: z.string().optional(),
  /** Role display names separated by `;` (semicolon). */
  roleNames: z
    .string()
    .min(1, 'En az bir rol adı gerekli (noktalı virgülle ayırın)'),
})

export type RoleGroupImportRow = z.infer<typeof roleGroupImportRowSchema>

export const roleGroupImportSchema: ImportSchema<
  typeof roleGroupImportRowSchema
> = {
  columns: [
    {
      name: 'title',
      displayName: 'Başlık',
      type: 'string',
      required: true,
      zodSchema: z.string().min(1),
    },
    {
      name: 'description',
      displayName: 'Açıklama',
      type: 'string',
      required: false,
      zodSchema: z.string().optional(),
    },
    {
      name: 'roleNames',
      displayName: 'Rol adları (noktalı virgülle)',
      type: 'string',
      required: true,
      zodSchema: z.string().min(1),
      description: 'Örnek: Yönetici;Destek',
    },
  ],
  baseSchema: roleGroupImportRowSchema,
}

export const roleGroupImportInstructions = `ROL GRUBU İÇE AKTARMA
- İlk satır başlık satırıdır; silmeyin.
- Başlık zorunludur.
- Rol adları birden fazlaysa noktalı virgül (;) ile ayırın. Rol adları veritabanındaki rol adıyla birebir eşleşmelidir.
`
