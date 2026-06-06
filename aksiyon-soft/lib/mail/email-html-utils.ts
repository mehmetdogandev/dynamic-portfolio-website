/**
 * Shared utilities for rendering email HTML content (URL fetch, CID replacement, etc.)
 * Used by mail-viewer and email-log-detail-dialog.
 */

/** True if htmlContent is a file URL (e.g. api/files/{id}/view) to be fetched */
export function isHtmlContentUrl(value: string): boolean {
  const s = value.trim()
  return (
    (s.startsWith('api/files/') || s.startsWith('/api/files/')) &&
    s.includes('/view')
  )
}

/** Ensure relative URLs in email HTML resolve to current origin (e.g. images) */
export function ensureBaseUrlForHtml(html: string): string {
  if (typeof window === 'undefined') return html
  const base = window.location.origin + '/'
  if (/<head[^>]*>/i.test(html) && !/<base\s/i.test(html)) {
    return html.replace(/<head(\s[^>]*)?>/i, `<head$1><base href="${base}">`)
  }
  return html
}

/** Replace cid:xxx in HTML with actual attachment URLs so inline images display */
export function replaceCidWithAttachmentUrls(
  html: string,
  attachmentPath?: string | null,
  attachments?: Array<{
    cid?: string
    url?: string
    path?: string
    fileId?: string
  }> | null
): string {
  if (typeof window === 'undefined') return html
  const origin = window.location.origin + '/'
  const toAbsolute = (u: string) =>
    u.startsWith('http')
      ? u
      : u.startsWith('/')
        ? origin.slice(0, -1) + u
        : origin + u

  const cidToUrl = new Map<string, string>()
  if (attachments?.length) {
    for (const a of attachments) {
      const cid = a?.cid
      const url =
        a?.url ??
        (a?.fileId ? `/api/files/${a.fileId}/view` : undefined) ??
        a?.path
      if (cid && url) cidToUrl.set(cid, toAbsolute(url))
    }
  }
  const fallbackUrl =
    attachmentPath != null && attachmentPath !== ''
      ? toAbsolute(attachmentPath)
      : null

  return html.replace(/\b(src|href)=["']cid:([^"']+)["']/gi, (_, attr, cid) => {
    const url = cidToUrl.get(cid) ?? fallbackUrl
    return url ? `${attr}="${url}"` : _
  })
}
