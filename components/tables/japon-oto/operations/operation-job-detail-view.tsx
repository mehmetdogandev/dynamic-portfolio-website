'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useTRPC } from '@/lib/trpc/client'
import { ADMIN_PANEL_PATH } from '@/lib/admin-path'
import { getJaponJobStatusLabel } from '@/lib/japon/service-job-status'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function OperationJobDetailView({ jobId }: { jobId: string }) {
  const trpc = useTRPC()

  const { data, isLoading, isError, error } = useQuery(
    trpc.japonServiceJob.getById.queryOptions({ id: jobId })
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <p className="text-destructive text-sm">
        {error?.message ?? 'İşlem bulunamadı'}
      </p>
    )
  }

  const { job, services, parts, status } = data

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`${ADMIN_PANEL_PATH}/japon-oto/operations`}>
            <ArrowLeft className="mr-1 size-4" />
            İşlemler
          </Link>
        </Button>
        <Badge variant="secondary">{getJaponJobStatusLabel(status)}</Badge>
        <Button variant="link" size="sm" asChild>
          <Link
            href={`${ADMIN_PANEL_PATH}/japon-oto/customers/${job.customerId}`}
          >
            Müşteri detayı
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>İşlem özeti</CardTitle>
          <CardDescription>
            {new Date(job.createdAt).toLocaleString('tr-TR')} · KM:{' '}
            {job.kmAtVisit.toLocaleString('tr-TR')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {job.notes ? <p>{job.notes}</p> : null}
          {job.serviceFee ? (
            <p className="font-medium">Hizmet ücreti: {job.serviceFee} ₺</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Yapılan servisler</CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-muted-foreground text-sm">Kayıtlı servis yok.</p>
          ) : (
            <ul className="list-inside list-disc text-sm">
              {services.map((s) => (
                <li key={s.id}>{s.name}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parçalar</CardTitle>
        </CardHeader>
        <CardContent>
          {parts.length === 0 ? (
            <p className="text-muted-foreground text-sm">Parça kaydı yok.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parça</TableHead>
                  <TableHead>Marka</TableHead>
                  <TableHead>Adet</TableHead>
                  <TableHead className="text-right">Fiyat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.partName}</TableCell>
                    <TableCell>{p.brand ?? '—'}</TableCell>
                    <TableCell>{p.quantity}</TableCell>
                    <TableCell className="text-right">
                      {p.unitPrice} ₺
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
