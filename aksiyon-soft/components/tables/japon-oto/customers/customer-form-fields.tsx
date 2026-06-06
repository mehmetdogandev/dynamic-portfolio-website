'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export type CustomerFormValue = {
  name: string
  surname: string
  phone: string
  address: string
  notes: string
}

export const emptyCustomerFormValue: CustomerFormValue = {
  name: '',
  surname: '',
  phone: '',
  address: '',
  notes: '',
}

export function CustomerFormFields({
  value,
  onChange,
  disabled = false,
}: {
  value: CustomerFormValue
  onChange: (next: CustomerFormValue) => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="customer-form-name">Ad *</Label>
          <Input
            id="customer-form-name"
            value={value.name}
            onChange={(event) =>
              onChange({ ...value, name: event.target.value })
            }
            disabled={disabled}
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="customer-form-surname">Soyad *</Label>
          <Input
            id="customer-form-surname"
            value={value.surname}
            onChange={(event) =>
              onChange({ ...value, surname: event.target.value })
            }
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="customer-form-phone">Telefon *</Label>
        <Input
          id="customer-form-phone"
          value={value.phone}
          onChange={(event) =>
            onChange({ ...value, phone: event.target.value })
          }
          disabled={disabled}
          placeholder="+90 555 123 45 67"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="customer-form-address">Adres</Label>
        <Input
          id="customer-form-address"
          value={value.address}
          onChange={(event) =>
            onChange({ ...value, address: event.target.value })
          }
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="customer-form-notes">Not</Label>
        <Textarea
          id="customer-form-notes"
          value={value.notes}
          onChange={(event) =>
            onChange({ ...value, notes: event.target.value })
          }
          disabled={disabled}
          rows={3}
        />
      </div>
    </div>
  )
}
