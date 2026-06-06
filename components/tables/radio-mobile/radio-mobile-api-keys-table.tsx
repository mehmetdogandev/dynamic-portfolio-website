'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useTRPC } from '@/lib/trpc/client'
import { toast } from 'sonner'

export function RadioMobileApiKeysTable() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [plainKey, setPlainKey] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [perms, setPerms] = useState({
    canAndroidRelease: true,
    canAndroidDebug: false,
    canIosRelease: false,
    canIosDebug: false,
  })

  const apiKeyRouter = trpc.radioMobile.apiKey

  const listQuery = useQuery(apiKeyRouter.list.queryOptions())

  const createMutation = useMutation(
    apiKeyRouter.create.mutationOptions({
      onSuccess: (data) => {
        setPlainKey(data.plainKey)
        setOpen(false)
        setName('')
        queryClient.invalidateQueries({
          queryKey: apiKeyRouter.list.queryKey(),
        })
      },
      onError: (e) => toast.error(e.message),
    })
  )

  const revokeMutation = useMutation(
    apiKeyRouter.delete.mutationOptions({
      onSuccess: () => {
        toast.success('Anahtar iptal edildi')
        queryClient.invalidateQueries({
          queryKey: apiKeyRouter.list.queryKey(),
        })
      },
    })
  )

  return (
    <div className="space-y-4">
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" />
        Yeni API anahtarı
      </Button>

      {plainKey ? (
        <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-4 text-sm">
          <p className="font-medium">Anahtar yalnızca bir kez gösterilir:</p>
          <code className="mt-2 block break-all">{plainKey}</code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              void navigator.clipboard.writeText(plainKey)
              toast.success('Panoya kopyalandı')
            }}
          >
            Kopyala
          </Button>
        </div>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ad</TableHead>
            <TableHead>Önek</TableHead>
            <TableHead>Yetkiler</TableHead>
            <TableHead>Son kullanım</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(listQuery.data ?? []).map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              <TableCell>…{row.keyPrefix}</TableCell>
              <TableCell className="text-xs">
                {[
                  row.canAndroidRelease && 'Android Release',
                  row.canAndroidDebug && 'Android Debug',
                  row.canIosRelease && 'iOS Release',
                  row.canIosDebug && 'iOS Debug',
                ]
                  .filter(Boolean)
                  .join(', ') || '—'}
              </TableCell>
              <TableCell>
                {row.lastUsedAt
                  ? new Date(row.lastUsedAt).toLocaleString('tr-TR')
                  : '—'}
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm('Bu anahtar iptal edilsin mi?')) {
                      revokeMutation.mutate({ id: row.id })
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API anahtarı oluştur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="key-name">Ad</Label>
              <Input
                id="key-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {(
              [
                ['canAndroidRelease', 'Android Release'],
                ['canAndroidDebug', 'Android Debug'],
                ['canIosRelease', 'iOS Release'],
                ['canIosDebug', 'iOS Debug'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={perms[key]}
                  onCheckedChange={(v) =>
                    setPerms((p) => ({ ...p, [key]: v === true }))
                  }
                />
                {label}
              </label>
            ))}
            <Button
              type="button"
              disabled={!name.trim() || createMutation.isPending}
              onClick={() =>
                createMutation.mutate({
                  name: name.trim(),
                  ...perms,
                })
              }
            >
              Oluştur
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
