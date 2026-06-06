/** İstemci: dosyayı verilen S3 prefix ile yükler, `files` tablosu id'sini döner. */
export async function uploadFileWithPrefix(
  file: File,
  prefix: string
): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('prefix', prefix)

  const res = await fetch('/api/files/upload', { method: 'POST', body: fd })
  const j = (await res.json()) as {
    success?: boolean
    fileId?: string
    error?: string
    details?: string
  }

  if (!res.ok || !j.fileId) {
    throw new Error(j.details || j.error || 'Dosya yüklenemedi')
  }

  return j.fileId
}

/** İstemci: medya dosyasını yükler, `files` tablosu id'sini döner. */
export async function uploadMediaFile(file: File): Promise<string> {
  return uploadFileWithPrefix(file, 'media')
}

/** Footer sosyal "Diğer" platform ikonu — yalnızca .ico (sunucuda doğrulanır). */
export async function uploadFooterSocialIcon(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  if (!name.endsWith('.ico')) {
    throw new Error('Yalnızca .ico dosyaları yüklenebilir')
  }
  return uploadFileWithPrefix(file, 'footer-social-icon')
}
