export type AdminAboutProfileRow = {
  id: string
  lead: string
  intro: string
  introPart2: string | null
  introPart3: string | null
  introPart4: string | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  seoTitle: string | null
  seoDescription: string | null
  robotsIndex: boolean
}
