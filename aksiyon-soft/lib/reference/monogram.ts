/** Tutarlı monogram gradyanları (Tailwind) — id’ye göre seçilir. */
export const REFERENCE_MONOGRAM_CLASSES = [
  'from-slate-700 to-slate-900',
  'from-emerald-800 to-emerald-950',
  'from-amber-700 to-orange-900',
  'from-sky-700 to-indigo-900',
  'from-rose-700 to-rose-950',
  'from-teal-700 to-cyan-900',
  'from-stone-600 to-stone-900',
  'from-lime-800 to-green-950',
] as const

export function referenceMonogramText(name: string): string {
  const t = name.trim()
  if (!t) return '??'
  const parts = t.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const a = [...parts[0]!][0]
    const b = [...parts[1]!][0]
    if (a && b) return `${a}${b}`.toLocaleUpperCase('tr-TR')
  }
  const chars = [...t]
  if (chars.length >= 2) {
    return `${chars[0]}${chars[1]}`.toLocaleUpperCase('tr-TR')
  }
  return `${chars[0] ?? '?'}${chars[0] ?? '?'}`.toLocaleUpperCase('tr-TR')
}

export function referenceMonogramClassForId(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % 256
  return REFERENCE_MONOGRAM_CLASSES[h % REFERENCE_MONOGRAM_CLASSES.length]!
}
