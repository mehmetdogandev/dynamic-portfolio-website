import 'server-only'
import { JSDOM } from 'jsdom'

export interface BlogContent {
  type: 'doc'
  version: 1
  html: string
  imageFileIds: string[]
  videoFileIds: string[]
}

const EMPTY_CONTENT: BlogContent = {
  type: 'doc',
  version: 1,
  html: '<p></p>',
  imageFileIds: [],
  videoFileIds: [],
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)]
}

const MEDIA_CLASS = 'blog-content-media'
const MEDIA_BLOCK_CLASS = 'blog-me-media-block'

function applyRegexChromeCoarseStrip(html: string): string {
  let out = html.replace(
    /<span\b[^>]*\bclass=["'][^"']*blog-me-align-group[^"']*["'][^>]*>[\s\S]*?<\/span>/gi,
    ''
  )
  out = out.replace(
    /<button\b[^>]*\bdata-remove-video\b[^>]*>[\s\S]*?<\/button>/gi,
    ''
  )
  out = out.replace(
    /<span\b[^>]*\bdata-blog-editor-chrome=["']true["'][^>]*>[\s\S]*?<\/span>/gi,
    ''
  )
  out = out.replace(
    /<span\b[^>]*\bclass=["'][^"']*blog-me-media-actions[^"']*["'][^>]*>[\s\S]*?<\/span>/gi,
    ''
  )
  return out
}

/**
 * DOM pass: optional editor chrome removal; always ensures `figure[data-blog-media]`
 * has public CSS classes (legacy rows stored without `blog-content-media`).
 */
function prepareBlogBodyHtml(html: string, stripChrome: boolean): string {
  const pre = stripChrome ? applyRegexChromeCoarseStrip(html) : html
  try {
    const dom = new JSDOM(
      `<!DOCTYPE html><body><div id="blog-html-root">${pre}</div></body>`
    )
    const root = dom.window.document.getElementById('blog-html-root')
    if (!root) return pre

    if (stripChrome) {
      root.querySelectorAll('[data-blog-editor-chrome="true"]').forEach((n) => {
        n.remove()
      })
      root.querySelectorAll('.blog-me-media-actions').forEach((n) => n.remove())
      root.querySelectorAll('.blog-me-align-group').forEach((n) => n.remove())
      root.querySelectorAll('.blog-me-media-overlay').forEach((n) => n.remove())
      root
        .querySelectorAll('.blog-me-media-resize-handles')
        .forEach((n) => n.remove())
      root
        .querySelectorAll('button[data-remove-video]')
        .forEach((n) => n.remove())
    }

    root.querySelectorAll('figure[data-blog-media]').forEach((fig) => {
      const cls = fig.getAttribute('class') ?? ''
      const tokens = new Set(
        cls
          .split(/\s+/)
          .map((s) => s.trim())
          .filter(Boolean)
      )
      tokens.add(MEDIA_CLASS)
      tokens.add(MEDIA_BLOCK_CLASS)
      fig.setAttribute('class', [...tokens].join(' '))
      const dw = fig.getAttribute('data-blog-width')
      if (dw != null && dw.trim() !== '') {
        const n = Number.parseFloat(dw)
        if (Number.isFinite(n) && n > 0 && n <= 100) {
          const el = fig as HTMLElement
          el.style.width = `min(${n}%, 100%)`
          el.style.maxWidth = '100%'
        }
      }
      const dh = fig.getAttribute('data-blog-height')
      if (dh != null && dh.trim() !== '') {
        const n = Number.parseFloat(dh)
        if (Number.isFinite(n) && n > 0) {
          const el = fig as HTMLElement
          el.style.height = `${Math.round(n)}px`
        }
      }
      const align = fig.getAttribute('data-blog-align')
      if (align === 'center') {
        const el = fig as HTMLElement
        el.style.marginLeft = 'auto'
        el.style.marginRight = 'auto'
      } else if (align === 'right') {
        const el = fig as HTMLElement
        el.style.marginLeft = 'auto'
        el.style.marginRight = '0'
      } else if (align === 'left') {
        const el = fig as HTMLElement
        el.style.marginLeft = '0'
        el.style.marginRight = 'auto'
      }

      const cropJson = fig.getAttribute('data-blog-crop')
      if (cropJson) {
        try {
          const c = JSON.parse(cropJson) as {
            x: number
            y: number
            width: number
            height: number
          }
          const img = fig.querySelector('img')
          if (
            img &&
            [c.x, c.y, c.width, c.height].every(
              (n) => typeof n === 'number' && Number.isFinite(n)
            ) &&
            c.width > 0 &&
            c.height > 0
          ) {
            const top = Math.max(0, Math.min(100, c.y))
            const left = Math.max(0, Math.min(100, c.x))
            const right = Math.max(0, 100 - c.x - c.width)
            const bottom = Math.max(0, 100 - c.y - c.height)
            const el = img as HTMLElement
            el.style.objectFit = 'cover'
            el.style.clipPath = `inset(${top}% ${right}% ${bottom}% ${left}%)`
          }
        } catch {
          /* ignore invalid crop JSON */
        }
      }
    })

    return root.innerHTML
  } catch {
    return pre
  }
}

export function extractBlogImageFileIdsFromHtml(html: string): string[] {
  const matches = html.matchAll(
    /<img\b[^>]*\bdata-file-id=["']([0-9a-fA-F-]{36})["'][^>]*>/g
  )
  return uniqueIds(Array.from(matches, ([, fileId]) => fileId))
}

export function extractBlogVideoFileIdsFromHtml(html: string): string[] {
  const matches = html.matchAll(
    /<video\b[^>]*\bdata-file-id=["']([0-9a-fA-F-]{36})["'][^>]*>/g
  )
  return uniqueIds(Array.from(matches, ([, fileId]) => fileId))
}

export function normalizeBlogContent(
  value: unknown,
  options: {
    allowedImageFileIds?: Set<string>
    allowedVideoFileIds?: Set<string>
    /** When true, removes editor-only toolbar nodes from HTML (e.g. public blog). */
    stripEditorChrome?: boolean
  } = {}
): BlogContent {
  if (!value || typeof value !== 'object') {
    return EMPTY_CONTENT
  }

  const raw = value as Partial<BlogContent>
  const html =
    typeof raw.html === 'string' && raw.html.trim() ? raw.html : '<p></p>'
  const deduped = uniqueIds(extractBlogImageFileIdsFromHtml(html))
  const filteredImages =
    options.allowedImageFileIds && options.allowedImageFileIds.size > 0
      ? deduped.filter((id) => options.allowedImageFileIds!.has(id))
      : deduped
  const videoFileIds = extractBlogVideoFileIdsFromHtml(html)
  const filteredVideos =
    options.allowedVideoFileIds && options.allowedVideoFileIds.size > 0
      ? uniqueIds(videoFileIds).filter((id) =>
          options.allowedVideoFileIds!.has(id)
        )
      : uniqueIds(videoFileIds)

  return {
    type: 'doc',
    version: 1,
    html: toRenderableBlogHtml(
      html,
      new Set(filteredImages),
      new Set(filteredVideos),
      { stripEditorChrome: options.stripEditorChrome }
    ),
    imageFileIds: filteredImages,
    videoFileIds: filteredVideos,
  }
}

export function toRenderableBlogHtml(
  html: string,
  allowedImageFileIds?: Set<string>,
  allowedVideoFileIds?: Set<string>,
  renderOptions?: { stripEditorChrome?: boolean }
): string {
  const base = prepareBlogBodyHtml(
    html,
    renderOptions?.stripEditorChrome === true
  )
  const withImages = base.replace(
    /<img\b[^>]*\bdata-file-id=["']([0-9a-fA-F-]{36})["'][^>]*>/g,
    (rawTag, fileId: string) => {
      if (allowedImageFileIds && !allowedImageFileIds.has(fileId)) {
        return ''
      }
      const tagWithoutSrc = rawTag.replace(/\s+src=(['"]).*?\1/gi, '')
      return tagWithoutSrc.replace(
        '<img',
        `<img src="/api/files/${fileId}/view"`
      )
    }
  )
  return withImages.replace(
    /<video\b[^>]*\bdata-file-id=["']([0-9a-fA-F-]{36})["'][^>]*>/g,
    (rawTag, fileId: string) => {
      if (allowedVideoFileIds && !allowedVideoFileIds.has(fileId)) {
        return ''
      }
      const withoutSrc = rawTag.replace(/\s+src=(['"]).*?\1/gi, '')
      const withControls = withoutSrc.includes('controls')
        ? withoutSrc
        : withoutSrc.replace('<video', '<video controls')
      return withControls.replace(
        '<video',
        `<video src="/api/files/${fileId}/view"`
      )
    }
  )
}
