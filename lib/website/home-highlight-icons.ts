import {
  Bot,
  Code2,
  Cpu,
  Database,
  Globe,
  Layers,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

export const HOME_HIGHLIGHT_ICON_KEYS = [
  'code2',
  'database',
  'cpu',
  'bot',
  'layers',
  'globe',
  'sparkles',
] as const

export type HomeHighlightIconKey = (typeof HOME_HIGHLIGHT_ICON_KEYS)[number]

export const HOME_HIGHLIGHT_ICONS: Record<HomeHighlightIconKey, LucideIcon> = {
  code2: Code2,
  database: Database,
  cpu: Cpu,
  bot: Bot,
  layers: Layers,
  globe: Globe,
  sparkles: Sparkles,
}

export const HOME_HIGHLIGHT_ICON_LABELS: Record<HomeHighlightIconKey, string> =
  {
    code2: 'Kod (Full-Stack)',
    database: 'Veritabanı / ERP',
    cpu: 'IoT / Donanım',
    bot: 'Yapay Zeka',
    layers: 'Katmanlı mimari',
    globe: 'Web / Global',
    sparkles: 'Yenilik / AI',
  }

export function resolveHomeHighlightIcon(
  iconKey: string
): LucideIcon {
  if (iconKey in HOME_HIGHLIGHT_ICONS) {
    return HOME_HIGHLIGHT_ICONS[iconKey as HomeHighlightIconKey]
  }
  return Code2
}
