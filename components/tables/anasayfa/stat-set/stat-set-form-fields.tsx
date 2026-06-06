'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  HOME_STAT_DEFAULT_HREFS,
  HOME_STAT_SOURCE_LABELS,
} from '@/lib/website/home-stat-config'
export type StatSetFormValues = {
  name: string
  yearsExperienceValue: string
  yearsExperienceLabel: string
  yearsExperienceHref: string
  experienceCountValue: string
  experienceCountLabel: string
  experienceCountHref: string
  experienceCountSource: 'MANUAL' | 'AUTO_EXPERIENCE_COUNT'
  companyCountValue: string
  companyCountLabel: string
  companyCountHref: string
  companyCountSource: 'MANUAL' | 'AUTO_REFERENCE_COUNT'
  studentsTaughtValue: string
  studentsTaughtLabel: string
  studentsTaughtHref: string
}

type StatSetFormFieldsProps = {
  values: StatSetFormValues
  onChange: (patch: Partial<StatSetFormValues>) => void
}

function StatBoxFields({
  title,
  value,
  label,
  href,
  onValueChange,
  onLabelChange,
  onHrefChange,
  valueDisabled,
  valuePlaceholder,
  hrefPlaceholder,
  sourceSelect,
}: {
  title: string
  value: string
  label: string
  href: string
  onValueChange: (v: string) => void
  onLabelChange: (v: string) => void
  onHrefChange: (v: string) => void
  valueDisabled?: boolean
  valuePlaceholder?: string
  hrefPlaceholder?: string
  sourceSelect?: React.ReactNode
}) {
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <p className="text-sm font-medium">{title}</p>
      {sourceSelect}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Değer</Label>
          <Input
            value={value}
            disabled={valueDisabled}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder={valuePlaceholder ?? 'ör. 3+'}
          />
        </div>
        <div className="space-y-2">
          <Label>Etiket</Label>
          <Input
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            placeholder="ör. Yıl Deneyim"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Bağlantı (href)</Label>
        <Input
          value={href}
          onChange={(e) => onHrefChange(e.target.value)}
          placeholder={hrefPlaceholder ?? 'Boş bırakılabilir'}
        />
      </div>
    </div>
  )
}

export function StatSetFormFields({
  values,
  onChange,
}: StatSetFormFieldsProps) {
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

      <StatBoxFields
        title="Yıl deneyimi"
        value={values.yearsExperienceValue}
        label={values.yearsExperienceLabel}
        href={values.yearsExperienceHref}
        onValueChange={(v) => onChange({ yearsExperienceValue: v })}
        onLabelChange={(v) => onChange({ yearsExperienceLabel: v })}
        onHrefChange={(v) => onChange({ yearsExperienceHref: v })}
        hrefPlaceholder={HOME_STAT_DEFAULT_HREFS.yearsExperience}
      />

      <StatBoxFields
        title="Deneyim sayısı"
        value={values.experienceCountValue}
        label={values.experienceCountLabel}
        href={values.experienceCountHref}
        onValueChange={(v) => onChange({ experienceCountValue: v })}
        onLabelChange={(v) => onChange({ experienceCountLabel: v })}
        onHrefChange={(v) => onChange({ experienceCountHref: v })}
        valueDisabled={values.experienceCountSource !== 'MANUAL'}
        valuePlaceholder={
          values.experienceCountSource === 'MANUAL'
            ? 'ör. 12'
            : 'Otomatik — deneyim kayıt sayısı'
        }
        hrefPlaceholder={HOME_STAT_DEFAULT_HREFS.experienceCount}
        sourceSelect={
          <div className="space-y-2">
            <Label>Değer kaynağı</Label>
            <Select
              value={values.experienceCountSource}
              onValueChange={(v) =>
                onChange({
                  experienceCountSource: v as
                    | 'MANUAL'
                    | 'AUTO_EXPERIENCE_COUNT',
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANUAL">
                  {HOME_STAT_SOURCE_LABELS.MANUAL}
                </SelectItem>
                <SelectItem value="AUTO_EXPERIENCE_COUNT">
                  {HOME_STAT_SOURCE_LABELS.AUTO_EXPERIENCE_COUNT}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <StatBoxFields
        title="Şirket / kurum sayısı"
        value={values.companyCountValue}
        label={values.companyCountLabel}
        href={values.companyCountHref}
        onValueChange={(v) => onChange({ companyCountValue: v })}
        onLabelChange={(v) => onChange({ companyCountLabel: v })}
        onHrefChange={(v) => onChange({ companyCountHref: v })}
        valueDisabled={values.companyCountSource !== 'MANUAL'}
        valuePlaceholder={
          values.companyCountSource === 'MANUAL'
            ? 'ör. 7'
            : 'Otomatik — referans sayısı'
        }
        hrefPlaceholder={HOME_STAT_DEFAULT_HREFS.companyCount}
        sourceSelect={
          <div className="space-y-2">
            <Label>Değer kaynağı</Label>
            <Select
              value={values.companyCountSource}
              onValueChange={(v) =>
                onChange({
                  companyCountSource: v as 'MANUAL' | 'AUTO_REFERENCE_COUNT',
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANUAL">
                  {HOME_STAT_SOURCE_LABELS.MANUAL}
                </SelectItem>
                <SelectItem value="AUTO_REFERENCE_COUNT">
                  {HOME_STAT_SOURCE_LABELS.AUTO_REFERENCE_COUNT}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <StatBoxFields
        title="Eğitim verilen öğrenci"
        value={values.studentsTaughtValue}
        label={values.studentsTaughtLabel}
        href={values.studentsTaughtHref}
        onValueChange={(v) => onChange({ studentsTaughtValue: v })}
        onLabelChange={(v) => onChange({ studentsTaughtLabel: v })}
        onHrefChange={(v) => onChange({ studentsTaughtHref: v })}
        valuePlaceholder="ör. 40+"
      />
    </div>
  )
}

export const EMPTY_STAT_SET_FORM: StatSetFormValues = {
  name: '',
  yearsExperienceValue: '3+',
  yearsExperienceLabel: 'Yıl Deneyim',
  yearsExperienceHref: HOME_STAT_DEFAULT_HREFS.yearsExperience,
  experienceCountValue: '',
  experienceCountLabel: 'Farklı Deneyim',
  experienceCountHref: HOME_STAT_DEFAULT_HREFS.experienceCount,
  experienceCountSource: 'AUTO_EXPERIENCE_COUNT',
  companyCountValue: '',
  companyCountLabel: 'Şirkette Çalışma',
  companyCountHref: HOME_STAT_DEFAULT_HREFS.companyCount,
  companyCountSource: 'AUTO_REFERENCE_COUNT',
  studentsTaughtValue: '40+',
  studentsTaughtLabel: 'Eğitim Verilen Öğrenci',
  studentsTaughtHref: '',
}

export function rowToFormValues(
  row: import('./types').AdminHomeStatSetRow
): StatSetFormValues {
  return {
    name: row.name,
    yearsExperienceValue: row.yearsExperienceValue,
    yearsExperienceLabel: row.yearsExperienceLabel,
    yearsExperienceHref: row.yearsExperienceHref ?? '',
    experienceCountValue: row.experienceCountValue,
    experienceCountLabel: row.experienceCountLabel,
    experienceCountHref: row.experienceCountHref ?? '',
    experienceCountSource:
      row.experienceCountSource === 'AUTO_EXPERIENCE_COUNT'
        ? 'AUTO_EXPERIENCE_COUNT'
        : 'MANUAL',
    companyCountValue: row.companyCountValue,
    companyCountLabel: row.companyCountLabel,
    companyCountHref: row.companyCountHref ?? '',
    companyCountSource:
      row.companyCountSource === 'AUTO_REFERENCE_COUNT'
        ? 'AUTO_REFERENCE_COUNT'
        : 'MANUAL',
    studentsTaughtValue: row.studentsTaughtValue,
    studentsTaughtLabel: row.studentsTaughtLabel,
    studentsTaughtHref: row.studentsTaughtHref ?? '',
  }
}

export function formValuesToMutationInput(values: StatSetFormValues) {
  return {
    name: values.name,
    yearsExperienceValue: values.yearsExperienceValue,
    yearsExperienceLabel: values.yearsExperienceLabel,
    yearsExperienceHref: values.yearsExperienceHref || null,
    experienceCountValue: values.experienceCountValue,
    experienceCountLabel: values.experienceCountLabel,
    experienceCountHref: values.experienceCountHref || null,
    experienceCountSource: values.experienceCountSource,
    companyCountValue: values.companyCountValue,
    companyCountLabel: values.companyCountLabel,
    companyCountHref: values.companyCountHref || null,
    companyCountSource: values.companyCountSource,
    studentsTaughtValue: values.studentsTaughtValue,
    studentsTaughtLabel: values.studentsTaughtLabel,
    studentsTaughtHref: values.studentsTaughtHref || null,
  }
}
