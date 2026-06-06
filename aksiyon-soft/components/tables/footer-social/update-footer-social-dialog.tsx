'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useTRPC } from '@/lib/trpc/client'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  FooterSocialFormFields,
  platformSelectFromRow,
} from './footer-social-form-fields'
import { buildFooterSocialPayload } from './footer-social-form-payload'
import {
  FOOTER_SOCIAL_OTHER_SELECT_VALUE,
  type AdminFooterSocialRow,
} from './types'

function stateFromRow(row: AdminFooterSocialRow) {
  return {
    platformSelect: platformSelectFromRow(row.platform),
    customLabel: row.customLabel ?? '',
    url: row.url,
    iconFileId: row.iconFileId,
    iconPreviewUrl: row.iconPreviewUrl,
    isActive: row.isActive,
  }
}

export function UpdateFooterSocialDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AdminFooterSocialRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(stateFromRow(row))

  useEffect(() => {
    if (!open) return
    setForm(stateFromRow(row))
  }, [open, row])

  const { mutateAsync, isPending } = useMutation(
    trpc.footerSocial.update.mutationOptions({
      onSuccess: async () => {
        toast.success('Sosyal medya kaydı güncellendi')
        await queryClient.invalidateQueries({
          queryKey: trpc.footerSocial.list.queryKey(),
        })
        onOpenChange(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const submit = async () => {
    const built = buildFooterSocialPayload(form)
    if ('error' in built) {
      toast.error(built.error)
      return
    }
    await mutateAsync({ id: row.id, ...built.payload })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Sosyal medyayı düzenle</DialogTitle>
        </DialogHeader>
        <FooterSocialFormFields
          excludeId={row.id}
          platformSelect={form.platformSelect}
          onPlatformSelectChange={(platformSelect) =>
            setForm((prev) => ({
              ...prev,
              platformSelect,
              ...(platformSelect === FOOTER_SOCIAL_OTHER_SELECT_VALUE
                ? {}
                : { customLabel: '', iconFileId: null, iconPreviewUrl: null }),
            }))
          }
          customLabel={form.customLabel}
          onCustomLabelChange={(customLabel) =>
            setForm((prev) => ({ ...prev, customLabel }))
          }
          url={form.url}
          onUrlChange={(url) => setForm((prev) => ({ ...prev, url }))}
          iconFileId={form.iconFileId}
          iconPreviewUrl={form.iconPreviewUrl}
          onIconFileIdChange={(iconFileId, iconPreviewUrl) =>
            setForm((prev) => ({ ...prev, iconFileId, iconPreviewUrl }))
          }
          isActive={form.isActive}
          onIsActiveChange={(isActive) =>
            setForm((prev) => ({ ...prev, isActive }))
          }
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            İptal
          </Button>
          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
