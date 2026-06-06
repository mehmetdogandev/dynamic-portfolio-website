/** Client: uploads slider asset to storage; returns `files` row id. */
export async function uploadSliderFile(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('prefix', 'slider')

  const res = await fetch('/api/files/upload', { method: 'POST', body: fd })
  const j = (await res.json()) as {
    success?: boolean
    fileId?: string
    error?: string
    details?: string
  }

  if (!res.ok || !j.fileId) {
    throw new Error(j.details || j.error || 'Slider dosyası yüklenemedi')
  }

  return j.fileId
}
