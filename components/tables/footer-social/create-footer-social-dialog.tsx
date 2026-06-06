'use client'

import { useState } from 'react'
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
import { FooterSocialFormFields } from './footer-social-form-fields'
import { buildFooterSocialPayload } from './footer-social-form-payload'
import {
  FOOTER_SOCIAL_OTHER_SELECT_VALUE,
  type FooterSocialPlatformSelectValue,
} from './types'

function resetFormState() {
  return {
    platformSelect: 'INSTAGRAM' as FooterSocialPlatformSelectValue,
    customLabel: '',
    url: '',
    iconFileId: null as string | null,
    iconPreviewUrl: null as string | null,
    isActive: false,
  }
}

export function CreateFooterSocialDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(resetFormState)

  const { mutateAsync, isPending } = useMutation(
    trpc.footerSocial.create.mutationOptions({
      onSuccess: async () => {
        toast.success('Sosyal medya kaydı eklendi')
        await queryClient.invalidateQueries({
          queryKey: trpc.footerSocial.list.queryKey(),
        })
        onOpenChange(false)
        setForm(resetFormState())
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
    await mutateAsync(built.payload)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setForm(resetFormState())
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni sosyal medya</DialogTitle>
        </DialogHeader>
        <FooterSocialFormFields
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
