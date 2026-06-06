'use client'

import {
  formatJaponMoney,
  parsePartLineTotal,
  sumPartRows,
} from '@/lib/japon/service-job-status'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableRow,
} from '@/components/ui/table'
import type { JaponPartDraft } from './customer-service-job-types'

type ServiceJobTotalsProps = {
  parts: ReadonlyArray<
    JaponPartDraft | { partName: string; quantity: number; unitPrice: string }
  >
  serviceFee?: string | null
}

function normalizeParts(
  parts: ServiceJobTotalsProps['parts']
): Array<{ partName: string; quantity: number; unitPrice: string }> {
  return parts
    .filter((p) => p.partName.trim().length > 0)
    .map((p) => ({
      partName: p.partName.trim(),
      quantity: Number(p.quantity) || 1,
      unitPrice:
        'unitPrice' in p && typeof p.unitPrice === 'string'
          ? p.unitPrice
          : String(p.unitPrice),
    }))
}

export function ServiceJobTotals({ parts, serviceFee }: ServiceJobTotalsProps) {
  const rows = normalizeParts(parts)
  const partsTotal = sumPartRows(rows)
  const fee = serviceFee ? Number(serviceFee) : 0
  const feeValue = Number.isFinite(fee) ? fee : 0
  const grandTotal = partsTotal + feeValue

  if (rows.length === 0 && !serviceFee) {
    return null
  }

  return (
    <div className="mt-2 overflow-x-auto rounded-md border">
      <Table>
        <TableBody>
          {rows.map((part, index) => {
            const lineTotal = parsePartLineTotal(part.quantity, part.unitPrice)
            return (
              <TableRow key={`${part.partName}-${index}`}>
                <TableCell className="font-medium">{part.partName}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  toplam:
                </TableCell>
                <TableCell className="w-32 text-right font-medium">
                  {formatJaponMoney(lineTotal)} ₺
                </TableCell>
              </TableRow>
            )
          })}
          <TableRow>
            <TableCell className="font-medium">Hizmet ücreti</TableCell>
            <TableCell className="text-right text-muted-foreground">
              :
            </TableCell>
            <TableCell className="text-right font-medium">
              {serviceFee ? `${formatJaponMoney(feeValue)} ₺` : '—'}
            </TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2} className="text-right font-semibold">
              Genel Toplam
            </TableCell>
            <TableCell className="text-right font-semibold">
              {formatJaponMoney(grandTotal)} ₺
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
