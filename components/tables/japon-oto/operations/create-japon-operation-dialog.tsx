'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { usePermission } from '@/lib/hooks/use-rbac'
import { JaponOperationWizard } from './operation-wizard'

type CreateJaponOperationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateJaponOperationDialog({
  open,
  onOpenChange,
}: CreateJaponOperationDialogProps) {
  const [instanceKey, setInstanceKey] = useState(0)
  const { data: canCreate, isLoading } = usePermission(
    SCOPES.JAPON_OTO_OPERATIONS,
    PERMISSIONS.CREATE
  )

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setInstanceKey((prev) => prev + 1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        {isLoading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
          </div>
        ) : canCreate ? (
          <JaponOperationWizard
            key={instanceKey}
            variant="dialog"
            onCancel={() => handleOpenChange(false)}
            onSuccess={() => handleOpenChange(false)}
          />
        ) : (
          <p className="text-muted-foreground text-sm">
            Yeni işlem için gerekli yetkiye sahip değilsiniz.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
