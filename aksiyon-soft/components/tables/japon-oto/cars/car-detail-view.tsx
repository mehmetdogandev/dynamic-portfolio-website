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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export function JaponCarDetailView({ carId }: { carId: string }) {
  const trpc = useTRPC()

  const { data, isLoading, isError, error } = useQuery(
    trpc.japonCar.getById.queryOptions({ id: carId })
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
        {error?.message ?? 'Araç bulunamadı'}
      </p>
    )
  }

  const { car, ownershipTimeline, jobsByPeriod } = data

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`${ADMIN_PANEL_PATH}/japon-oto/cars`}>
          <ArrowLeft className="mr-1 size-4" />
          Araç listesi
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{car.plate}</CardTitle>
          <CardDescription>
            {car.vehicleType} · {car.color} · {car.km.toLocaleString('tr-TR')}{' '}
            km
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sahiplik geçmişi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ownershipTimeline.map((period) => (
            <div
              key={period.id}
              className="border-l-2 border-primary pl-4 text-sm"
            >
              <p className="font-medium">
                {period.customerName} {period.customerSurname} ·{' '}
                {period.customerNo}
              </p>
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <span>
                  {new Date(period.startedAt).toLocaleDateString('tr-TR')}
                  {' — '}
                  {period.endedAt
                    ? new Date(period.endedAt).toLocaleDateString('tr-TR')
                    : 'Günümüz'}
                </span>
                {!period.endedAt ? (
                  <Badge variant="secondary">Güncel</Badge>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dönem bazlı işlemler</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {jobsByPeriod.map((period, index) => (
              <AccordionItem key={period.ownership.id} value={`p-${index}`}>
                <AccordionTrigger>
                  {period.ownership.customerName}{' '}
                  {period.ownership.customerSurname} ({period.jobs.length}{' '}
                  işlem)
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  {period.jobs.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      Bu dönemde işlem yok.
                    </p>
                  ) : (
                    period.jobs.map((job) => (
                      <div
                        key={job.id}
                        className="rounded-md border p-3 text-sm"
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">
                            {getJaponJobStatusLabel(job.status)}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {new Date(job.createdAt).toLocaleString('tr-TR')}
                          </span>
                        </div>
                        {job.services.length > 0 ? (
                          <p>
                            <span className="font-medium">Servisler: </span>
                            {job.services.map((s) => s.name).join(', ')}
                          </p>
                        ) : null}
                        {job.parts.length > 0 ? (
                          <ul className="mt-2 list-inside list-disc">
                            {job.parts.map((p) => (
                              <li key={p.id}>
                                {p.partName} ×{p.quantity}
                                {p.brand ? ` (${p.brand})` : ''}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
