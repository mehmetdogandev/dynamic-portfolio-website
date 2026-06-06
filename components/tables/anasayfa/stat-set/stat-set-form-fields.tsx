'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type StatSetFormValues = {
  name: string
  stat1Value: string
  stat1Label: string
  stat2Value: string
  stat2Label: string
  stat3Value: string
  stat3Label: string
  stat4Value: string
  stat4Label: string
}

type StatSetFormFieldsProps = {
  values: StatSetFormValues
  onChange: (patch: Partial<StatSetFormValues>) => void
}

function StatPair({
  index,
  value,
  label,
  onValueChange,
  onLabelChange,
}: {
  index: number
  value: string
  label: string
  onValueChange: (v: string) => void
  onLabelChange: (v: string) => void
}) {
  return (
    <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`stat${index}-value`}>{index}. kutu — değer</Label>
        <Input
          id={`stat${index}-value`}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="ör. 3+"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`stat${index}-label`}>{index}. kutu — etiket</Label>
        <Input
          id={`stat${index}-label`}
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="ör. Yıl Deneyim"
        />
      </div>
    </div>
  )
}

export function StatSetFormFields({ values, onChange }: StatSetFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="stat-set-name">Set adı</Label>
        <Input
          id="stat-set-name"
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="ör. 2026 Ana sayfa istatistikleri"
        />
      </div>
      <StatPair
        index={1}
        value={values.stat1Value}
        label={values.stat1Label}
        onValueChange={(v) => onChange({ stat1Value: v })}
        onLabelChange={(v) => onChange({ stat1Label: v })}
      />
      <StatPair
        index={2}
        value={values.stat2Value}
        label={values.stat2Label}
        onValueChange={(v) => onChange({ stat2Value: v })}
        onLabelChange={(v) => onChange({ stat2Label: v })}
      />
      <StatPair
        index={3}
        value={values.stat3Value}
        label={values.stat3Label}
        onValueChange={(v) => onChange({ stat3Value: v })}
        onLabelChange={(v) => onChange({ stat3Label: v })}
      />
      <StatPair
        index={4}
        value={values.stat4Value}
        label={values.stat4Label}
        onValueChange={(v) => onChange({ stat4Value: v })}
        onLabelChange={(v) => onChange({ stat4Label: v })}
      />
    </div>
  )
}

export const EMPTY_STAT_SET_FORM: StatSetFormValues = {
  name: '',
  stat1Value: '',
  stat1Label: '',
  stat2Value: '',
  stat2Label: '',
  stat3Value: '',
  stat3Label: '',
  stat4Value: '',
  stat4Label: '',
}
