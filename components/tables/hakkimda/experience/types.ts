export type AdminAboutExperienceRow = {
  id: string
  title: string
  company: string
  location: string | null
  startDate: string
  endDate: string | null
  description: string | null
  fileId: string | null
  fileViewUrl: string | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}
