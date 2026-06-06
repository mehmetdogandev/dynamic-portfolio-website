/** İstemci: logo dosyasını yükler, `files` tablosu id’sini döner. */
export async function uploadReferenceLogo(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('prefix', 'references/logos')
  const res = await fetch('/api/files/upload', { method: 'POST', body: fd })
  const j = (await res.json()) as {
    success?: boolean
    fileId?: string
    error?: string
    details?: string
  }
  if (!res.ok || !j.fileId) {
    throw new Error(j.details || j.error || 'Logo yüklenemedi')
  }
  return j.fileId
}
