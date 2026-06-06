export type AdminMediaRow = {
  id: string
  mediaGroupId: string
  mediaGroupName: string | null
  fileId: string
  fileName: string | null
  fileMimeType: string | null
  type: string
  title: string
  description: string | null
  imageAlt: string | null
  parentMediaId: string | null
  parentMediaTitle: string | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  fileViewUrl: string | null
}
