'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { Braces, Code2, ImagePlus, Minus, Plus, Video, X } from 'lucide-react'
import { toast } from 'sonner'
import type { BlogContent } from '@/lib/blog/content'
import { createBlogNumberingLibraryExtension } from '@/lib/blog/medium-list-extension'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import type MediumEditor from 'medium-editor'
import 'medium-editor/dist/css/medium-editor.css'
import 'medium-editor/dist/css/themes/default.css'
import './medium-editor-blog.css'

type UploadResponse = {
  fileId?: string
  error?: string
  details?: string
}

type BlockMenuAction = 'image' | 'video' | 'embed' | 'code' | 'divider'

type PlusPosition = {
  top: number
  left: number
}

const BLOCK_SELECTOR =
  'p, h1, h2, h3, h4, h5, h6, blockquote, pre, ul, ol, hr, figure.blog-content-media, .blog-me-media-block'
const VIDEO_BLOCK_SELECTOR = '[data-blog-media="video"]'
const MEDIA_FIGURE_SELECTOR =
  'figure.blog-content-media, figure.blog-me-media-block, figure[data-blog-media]'
const BLOCK_ID_ATTR = 'data-block-id'
const SVG_TRASH =
  '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
const FIGURE_ALIGNMENTS = ['left', 'center', 'right'] as const
const RESIZE_HANDLE_DIRECTIONS = [
  'n',
  'ne',
  'e',
  'se',
  's',
  'sw',
  'w',
  'nw',
] as const
const MIN_MEDIA_WIDTH_PERCENT = 15
const MAX_MEDIA_WIDTH_PERCENT = 100
const MIN_MEDIA_HEIGHT_PX = 120
const MAX_MEDIA_HEIGHT_PX = 1200

type FigureAlignment = (typeof FIGURE_ALIGNMENTS)[number]
type ResizeHandleDirection = (typeof RESIZE_HANDLE_DIRECTIONS)[number]

function buildMediaEditorChromeHtml(options: {
  includeTrash: boolean
}): string {
  if (!options.includeTrash) return ''
  return `<span class="blog-me-media-actions blog-me-editor-only" data-blog-editor-chrome="true" contenteditable="false"><button type="button" class="blog-me-media-remove-icon" data-remove-video aria-label="Videoyu sil">${SVG_TRASH}</button></span>`
}

let blockIdSequence = 0

function nextBlockId(): string {
  blockIdSequence += 1
  return `blog-block-${blockIdSequence}`
}

function extractImageFileIds(html: string): string[] {
  const matches = html.matchAll(
    /<img\b[^>]*\bdata-file-id=["']([0-9a-fA-F-]{36})["'][^>]*>/g
  )
  return [...new Set(Array.from(matches, ([, fileId]) => fileId))]
}

function extractVideoFileIds(html: string): string[] {
  const matches = html.matchAll(
    /<video\b[^>]*\bdata-file-id=["']([0-9a-fA-F-]{36})["'][^>]*>/g
  )
  return [...new Set(Array.from(matches, ([, fileId]) => fileId))]
}

function normalizeEditorHtml(html: string | null): string {
  const t = (html ?? '').trim()
  return t ? t : '<p></p>'
}

function applyBlogCropToFigureImg(fig: HTMLElement): void {
  const raw = fig.getAttribute('data-blog-crop')
  const img = fig.querySelector('img')
  if (!img || !raw) {
    if (img) {
      img.style.removeProperty('clip-path')
      img.style.removeProperty('object-fit')
    }
    return
  }
  try {
    const c = JSON.parse(raw) as {
      x: number
      y: number
      width: number
      height: number
    }
    if (
      ![c.x, c.y, c.width, c.height].every(
        (n) => typeof n === 'number' && Number.isFinite(n)
      ) ||
      c.width <= 0 ||
      c.height <= 0
    ) {
      return
    }
    const top = Math.max(0, Math.min(100, c.y))
    const left = Math.max(0, Math.min(100, c.x))
    const right = Math.max(0, 100 - c.x - c.width)
    const bottom = Math.max(0, 100 - c.y - c.height)
    img.style.objectFit = 'cover'
    img.style.clipPath = `inset(${top}% ${right}% ${bottom}% ${left}%)`
  } catch {
    /* ignore */
  }
}

function normalizeMediaWidth(width: number): number {
  return Math.round(
    Math.min(MAX_MEDIA_WIDTH_PERCENT, Math.max(MIN_MEDIA_WIDTH_PERCENT, width))
  )
}

function normalizeMediaHeight(height: number): number {
  return Math.round(
    Math.min(MAX_MEDIA_HEIGHT_PX, Math.max(MIN_MEDIA_HEIGHT_PX, height))
  )
}

function getFigureAlignment(fig: HTMLElement): FigureAlignment {
  const raw = fig.getAttribute('data-blog-align')
  if (raw && FIGURE_ALIGNMENTS.includes(raw as FigureAlignment)) {
    return raw as FigureAlignment
  }
  return 'left'
}

function applyFigureLayout(fig: HTMLElement): void {
  const raw = fig.getAttribute('data-blog-width')
  const parsedWidth = raw ? Number.parseFloat(raw) : Number.NaN
  const width = Number.isFinite(parsedWidth)
    ? normalizeMediaWidth(parsedWidth)
    : MAX_MEDIA_WIDTH_PERCENT
  fig.setAttribute('data-blog-width', String(width))
  fig.style.width = `min(${width}%, 100%)`
  fig.style.maxWidth = '100%'
  const rawHeight = fig.getAttribute('data-blog-height')
  const parsedHeight = rawHeight ? Number.parseFloat(rawHeight) : Number.NaN
  if (Number.isFinite(parsedHeight)) {
    const nextHeight = normalizeMediaHeight(parsedHeight)
    fig.setAttribute('data-blog-height', String(nextHeight))
    fig.style.height = `${nextHeight}px`
  } else {
    fig.removeAttribute('data-blog-height')
    fig.style.removeProperty('height')
  }

  const alignment = getFigureAlignment(fig)
  fig.dataset.blogAlign = alignment
  if (alignment === 'center') {
    fig.style.marginLeft = 'auto'
    fig.style.marginRight = 'auto'
  } else if (alignment === 'right') {
    fig.style.marginLeft = 'auto'
    fig.style.marginRight = '0'
  } else {
    fig.style.marginLeft = '0'
    fig.style.marginRight = 'auto'
  }
}

interface BlogContentEditorProps {
  value: BlogContent
  onChange: (value: BlogContent) => void
  disabled?: boolean
  className?: string
  /** İçerik alanına görsel eklendikten sonra (başarılı yükleme) çağrılır. */
  onInlineImageInserted?: () => void
  /** İçerik alanına video eklendikten sonra (başarılı yükleme) çağrılır. */
  onInlineVideoInserted?: () => void
}

export function BlogContentEditor({
  value,
  onChange,
  disabled = false,
  className,
  onInlineImageInserted,
  onInlineVideoInserted,
}: BlogContentEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const mediumRef = useRef<MediumEditor | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const pendingActionBlockRef = useRef<string | null>(null)
  const skipSyncRef = useRef(false)
  const lastEmittedHtmlRef = useRef<string>('')
  const disabledRef = useRef(disabled)
  useLayoutEffect(() => {
    disabledRef.current = disabled
  }, [disabled])
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [hoverBlockId, setHoverBlockId] = useState<string | null>(null)
  const [menuBlockId, setMenuBlockId] = useState<string | null>(null)
  const [plusPosition, setPlusPosition] = useState<PlusPosition | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const [pendingImageSelectionFileId, setPendingImageSelectionFileId] =
    useState<string | null>(null)
  const [selectedMediaFigure, setSelectedMediaFigure] =
    useState<HTMLElement | null>(null)
  const [hoveredMediaFigure, setHoveredMediaFigure] =
    useState<HTMLElement | null>(null)
  const [resizingMediaFigure, setResizingMediaFigure] =
    useState<HTMLElement | null>(null)
  const [cropModal, setCropModal] = useState<{
    figure: HTMLElement
    img: HTMLImageElement
    imageSrc: string
  } | null>(null)
  const [cropState, setCropState] = useState({ x: 0, y: 0 })
  const [cropZoom, setCropZoom] = useState(1)
  const [cropArea, setCropArea] = useState<Area | null>(null)
  const blockMenuOpen = menuBlockId !== null
  const targetBlockId = hoverBlockId ?? activeBlockId

  const normalizeBlocks = useCallback(() => {
    const root = editorRef.current
    if (!root) return
    const candidates = root.querySelectorAll<HTMLElement>(BLOCK_SELECTOR)
    for (const node of candidates) {
      if (!root.contains(node)) continue
      if (!node.hasAttribute(BLOCK_ID_ATTR)) {
        node.setAttribute(BLOCK_ID_ATTR, nextBlockId())
      }
      if (node.matches(MEDIA_FIGURE_SELECTOR)) {
        node.classList.add('blog-content-media')
        node.classList.add('blog-me-media-block')
        node.setAttribute('contenteditable', 'false')
        applyFigureLayout(node)
        applyBlogCropToFigureImg(node)
      }
      if (node.matches('p') && node.hasAttribute('data-blog-media')) {
        node.setAttribute('contenteditable', 'false')
      }
    }
    if (!root.querySelector(BLOCK_SELECTOR)) {
      root.innerHTML = '<p></p>'
      const first = root.querySelector<HTMLElement>('p')
      if (first) first.setAttribute(BLOCK_ID_ATTR, nextBlockId())
    }
  }, [])

  const getBlockElementFromNode = useCallback((node: Node | null) => {
    const root = editorRef.current
    if (!root || !node) return null
    const parent =
      node instanceof Element ? node : (node.parentElement ?? undefined)
    if (!parent) return null
    const block = parent.closest<HTMLElement>(BLOCK_SELECTOR)
    if (!block || !root.contains(block)) return null
    if (!block.hasAttribute(BLOCK_ID_ATTR)) {
      block.setAttribute(BLOCK_ID_ATTR, nextBlockId())
    }
    return block
  }, [])

  const findBlockById = useCallback((blockId: string | null) => {
    const root = editorRef.current
    if (!root || !blockId) return null
    return root.querySelector<HTMLElement>(`[${BLOCK_ID_ATTR}="${blockId}"]`)
  }, [])

  const setCaretAfterBlock = useCallback(
    (blockId: string | null) => {
      const block = findBlockById(blockId)
      if (!block) return
      const selection = window.getSelection()
      if (!selection) return
      const range = document.createRange()
      range.selectNodeContents(block)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
      editorRef.current?.focus()
    },
    [findBlockById]
  )

  const updatePlusPosition = useCallback(
    (blockId: string | null) => {
      const block = findBlockById(blockId)
      const root = editorRef.current
      if (!block || !root) {
        setPlusPosition(null)
        return
      }
      const blockRect = block.getBoundingClientRect()
      const rootRect = root.getBoundingClientRect()
      setPlusPosition({
        top: blockRect.top - rootRect.top + blockRect.height / 2,
        left: -36,
      })
    },
    [findBlockById]
  )

  const emitFromMedium = useCallback(() => {
    const ed = mediumRef.current
    if (!ed) return
    normalizeBlocks()
    const html = normalizeEditorHtml(ed.getContent(0))
    lastEmittedHtmlRef.current = html
    skipSyncRef.current = true
    onChange({
      type: 'doc',
      version: 1,
      html,
      imageFileIds: extractImageFileIds(html),
      videoFileIds: extractVideoFileIds(html),
    })
    queueMicrotask(() => {
      skipSyncRef.current = false
    })
  }, [normalizeBlocks, onChange])

  const openCropModalForFigure = useCallback((fig: HTMLElement) => {
    const img = fig.querySelector('img')
    if (!img) return
    const src = img.currentSrc || img.getAttribute('src') || ''
    if (!src) return
    setCropModal({ figure: fig, img, imageSrc: src })
    setCropZoom(1)
    setCropState({ x: 0, y: 0 })
    setCropArea(null)
  }, [])

  const setFigureAlignment = useCallback(
    (fig: HTMLElement, alignment: FigureAlignment) => {
      fig.setAttribute('data-blog-align', alignment)
      applyFigureLayout(fig)
      normalizeBlocks()
      emitFromMedium()
    },
    [emitFromMedium, normalizeBlocks]
  )

  useEffect(() => {
    const el = editorRef.current
    if (!el) return

    let cancelled = false
    let editor: MediumEditor | null = null

    void (async () => {
      const { default: MediumEditorCtor } = await import('medium-editor')
      if (cancelled || !editorRef.current) return

      const NumberingLibrary =
        createBlogNumberingLibraryExtension(MediumEditorCtor)

      editor = new MediumEditorCtor(editorRef.current, {
        disableEditing: disabledRef.current,
        toolbar: {
          buttons: [
            'bold',
            'italic',
            'underline',
            'anchor',
            'h1',
            'h2',
            'blogNumberingLibrary',
            'justifyLeft',
            'justifyCenter',
            'justifyRight',
          ],
          diffTop: -8,
          diffLeft: 0,
          standardizeSelectionStart: true,
          allowMultiParagraphSelection: true,
        },
        extensions: {
          blogNumberingLibrary: new NumberingLibrary(),
        },
        placeholder: {
          text: 'İçerik yazın…',
        },
        targetBlank: true,
      })

      mediumRef.current = editor
      editor.setContent(normalizeEditorHtml(value.html), 0)
      normalizeBlocks()
      lastEmittedHtmlRef.current = normalizeEditorHtml(editor.getContent(0))

      editor.subscribe('editableInput', () => {
        normalizeBlocks()
        emitFromMedium()
      })
      editor.subscribe('blur', () => {
        normalizeBlocks()
        emitFromMedium()
      })
    })()

    return () => {
      cancelled = true
      editor?.destroy()
      mediumRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- single init; sync via other effects
  }, [emitFromMedium, normalizeBlocks])

  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    el.setAttribute('contenteditable', disabled ? 'false' : 'true')
  }, [disabled])

  useEffect(() => {
    const ed = mediumRef.current
    if (!ed || skipSyncRef.current) return
    const next = normalizeEditorHtml(value.html)
    if (next === normalizeEditorHtml(lastEmittedHtmlRef.current)) {
      return
    }
    const cur = normalizeEditorHtml(ed.getContent(0))
    if (cur !== next) {
      ed.setContent(next, 0)
      normalizeBlocks()
    }
  }, [normalizeBlocks, value.html])

  useEffect(() => {
    if (pendingImageSelectionFileId) {
      const root = editorRef.current
      const fig = root
        ?.querySelector<HTMLElement>(
          `figure[data-blog-media="image"] img[data-file-id="${pendingImageSelectionFileId}"]`
        )
        ?.closest<HTMLElement>('figure')
      if (fig) {
        setSelectedMediaFigure(fig)
        setHoveredMediaFigure(fig)
        setPendingImageSelectionFileId(null)
        return
      }
    }
    setSelectedMediaFigure((prev) => {
      if (!prev || !editorRef.current?.contains(prev)) return null
      return prev
    })
    setHoveredMediaFigure((prev) => {
      if (!prev || !editorRef.current?.contains(prev)) return null
      return prev
    })
    setResizingMediaFigure((prev) => {
      if (!prev || !editorRef.current?.contains(prev)) return null
      return prev
    })
  }, [pendingImageSelectionFileId, value.html])

  useLayoutEffect(() => {
    if (disabled) return
    const fig = hoveredMediaFigure ?? selectedMediaFigure
    if (!fig || !editorRef.current?.contains(fig)) return
    const isVideo = Boolean(fig.querySelector('video'))

    fig.classList.add('blog-me-media-selected')

    const chrome = document.createElement('div')
    chrome.className = 'blog-me-media-overlay'
    chrome.setAttribute('data-blog-editor-chrome', 'true')
    chrome.setAttribute('contenteditable', 'false')
    fig.appendChild(chrome)

    const toolbar = document.createElement('div')
    toolbar.className = 'blog-me-media-toolbar'
    chrome.appendChild(toolbar)

    const createButton = (label: string, mode: string) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'blog-me-media-toolbar-btn'
      button.setAttribute('data-overlay-action', mode)
      button.textContent = label
      toolbar.appendChild(button)
      return button
    }

    createButton('Boyutlandir', 'resize')
    if (!isVideo) {
      createButton('Kirp', 'crop')
    }
    const alignGroup = document.createElement('div')
    alignGroup.className = 'blog-me-align-group'
    alignGroup.setAttribute('data-blog-editor-chrome', 'true')
    ;(['left', 'center', 'right'] as const).forEach((alignment) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'blog-me-media-align-btn'
      button.textContent =
        alignment === 'left'
          ? 'Sola'
          : alignment === 'center'
            ? 'Ortala'
            : 'Saga'
      button.setAttribute('data-align', alignment)
      if (getFigureAlignment(fig) === alignment) {
        button.setAttribute('data-active', 'true')
      }
      alignGroup.appendChild(button)
    })
    createButton('Hizala', 'align')
    chrome.appendChild(alignGroup)

    const handlesWrap = document.createElement('div')
    handlesWrap.className = 'blog-me-media-resize-handles'
    handlesWrap.setAttribute('data-blog-editor-chrome', 'true')
    if (resizingMediaFigure === fig) {
      handlesWrap.setAttribute('data-open', 'true')
    }
    RESIZE_HANDLE_DIRECTIONS.forEach((direction) => {
      const handle = document.createElement('button')
      handle.type = 'button'
      handle.className = `blog-me-media-resize-handle blog-me-media-resize-handle-${direction}`
      handle.setAttribute('aria-label', `Medya boyutlandir ${direction}`)
      handle.setAttribute('data-direction', direction)
      handlesWrap.appendChild(handle)
    })
    fig.appendChild(handlesWrap)

    const onChromeClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      const action = target.getAttribute('data-overlay-action')
      if (action === 'resize') {
        event.preventDefault()
        event.stopPropagation()
        setSelectedMediaFigure(fig)
        setResizingMediaFigure(fig)
        handlesWrap.setAttribute('data-open', 'true')
        return
      }
      if (action === 'crop') {
        if (isVideo) return
        event.preventDefault()
        event.stopPropagation()
        setSelectedMediaFigure(fig)
        openCropModalForFigure(fig)
        return
      }
      if (action === 'align') {
        event.preventDefault()
        event.stopPropagation()
        const isOpen = alignGroup.getAttribute('data-open') === 'true'
        alignGroup.setAttribute('data-open', String(!isOpen))
        return
      }
      const alignment = target.getAttribute('data-align')
      if (
        alignment === 'left' ||
        alignment === 'center' ||
        alignment === 'right'
      ) {
        event.preventDefault()
        event.stopPropagation()
        setSelectedMediaFigure(fig)
        setFigureAlignment(fig, alignment)
      }
    }

    const onHandlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      const direction = target?.getAttribute(
        'data-direction'
      ) as ResizeHandleDirection | null
      if (!direction) return
      event.preventDefault()
      event.stopPropagation()
      setSelectedMediaFigure(fig)
      setResizingMediaFigure(fig)
      const rootEl = editorRef.current
      if (!rootEl) return
      const rootRect = rootEl.getBoundingClientRect()
      const startX = event.clientX
      const startY = event.clientY
      const startWidthPx = fig.getBoundingClientRect().width
      const startHeightPx = fig.getBoundingClientRect().height
      const startPercent = normalizeMediaWidth(
        (startWidthPx / rootRect.width) * 100
      )
      const startHeight = normalizeMediaHeight(startHeightPx)
      const includesHorizontal =
        direction.includes('e') || direction.includes('w')
      const includesVertical =
        direction.includes('n') || direction.includes('s')

      const onMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - startX
        const dy = moveEvent.clientY - startY
        const dxPercent = (dx / rootRect.width) * 100
        let horizontalDelta = 0
        if (direction.includes('e')) horizontalDelta += dxPercent
        if (direction.includes('w')) horizontalDelta -= dxPercent
        if (includesHorizontal) {
          const nextWidth = normalizeMediaWidth(startPercent + horizontalDelta)
          fig.setAttribute('data-blog-width', String(nextWidth))
        }

        let verticalDelta = 0
        if (direction.includes('s')) verticalDelta += dy
        if (direction.includes('n')) verticalDelta -= dy
        if (includesVertical) {
          const nextHeight = normalizeMediaHeight(startHeight + verticalDelta)
          fig.setAttribute('data-blog-height', String(nextHeight))
        }

        applyFigureLayout(fig)
      }

      const onUp = () => {
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerup', onUp)
        normalizeBlocks()
        emitFromMedium()
      }

      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerup', onUp)
    }

    chrome.addEventListener('click', onChromeClick)
    handlesWrap.addEventListener('pointerdown', onHandlePointerDown)

    return () => {
      chrome.removeEventListener('click', onChromeClick)
      handlesWrap.removeEventListener('pointerdown', onHandlePointerDown)
      chrome.remove()
      handlesWrap.remove()
      fig.classList.remove('blog-me-media-selected')
    }
  }, [
    disabled,
    emitFromMedium,
    hoveredMediaFigure,
    normalizeBlocks,
    openCropModalForFigure,
    resizingMediaFigure,
    selectedMediaFigure,
    setFigureAlignment,
  ])

  useEffect(() => {
    const root = editorRef.current
    if (!root) return

    const syncSelectionBlock = () => {
      const selection = window.getSelection()
      if (!selection?.anchorNode) return
      const block = getBlockElementFromNode(selection.anchorNode)
      setActiveBlockId(block?.getAttribute(BLOCK_ID_ATTR) ?? null)
    }

    const onMouseLeave = () => {
      if (!blockMenuOpen) {
        setHoverBlockId(null)
      }
      setHoveredMediaFigure(null)
    }

    const onFocusIn = (event: FocusEvent) => {
      const block = getBlockElementFromNode(event.target as Node | null)
      setActiveBlockId(block?.getAttribute(BLOCK_ID_ATTR) ?? null)
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (disabledRef.current) return
      const mediaFig = target.closest<HTMLElement>(MEDIA_FIGURE_SELECTOR)

      const removeButton = target.closest('[data-remove-video]')
      if (removeButton) {
        const block = removeButton.closest<HTMLElement>(VIDEO_BLOCK_SELECTOR)
        if (!block) return
        event.preventDefault()
        block.remove()
        setSelectedMediaFigure(null)
        normalizeBlocks()
        emitFromMedium()
        return
      }
      if (mediaFig && root.contains(mediaFig)) {
        setSelectedMediaFigure(mediaFig)
      }
    }

    const onRootPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      const isMediaTarget = Boolean(target.closest(MEDIA_FIGURE_SELECTOR))
      if (isMediaTarget) return
      if (target.closest('.blog-me-plus-overlay')) return
      if (target.closest('.blog-me-action-menu')) return
      setSelectedMediaFigure(null)
      setResizingMediaFigure(null)
    }

    const onMouseMove = (event: MouseEvent) => {
      const block = getBlockElementFromNode(event.target as Node | null)
      setHoverBlockId(block?.getAttribute(BLOCK_ID_ATTR) ?? null)
      const mediaFig = (
        event.target as HTMLElement | null
      )?.closest<HTMLElement>(MEDIA_FIGURE_SELECTOR)
      if (mediaFig && root.contains(mediaFig)) {
        setHoveredMediaFigure(mediaFig)
        return
      }
      setHoveredMediaFigure(null)
    }

    const onSelectionChange = () => {
      syncSelectionBlock()
    }

    const onViewportChanged = () => {
      updatePlusPosition(targetBlockId)
    }

    root.addEventListener('mousemove', onMouseMove)
    root.addEventListener('mouseleave', onMouseLeave)
    root.addEventListener('focusin', onFocusIn)
    root.addEventListener('click', onClick)
    root.addEventListener('pointerdown', onRootPointerDown)
    document.addEventListener('selectionchange', onSelectionChange)
    window.addEventListener('scroll', onViewportChanged, true)
    window.addEventListener('resize', onViewportChanged)

    syncSelectionBlock()

    return () => {
      root.removeEventListener('mousemove', onMouseMove)
      root.removeEventListener('mouseleave', onMouseLeave)
      root.removeEventListener('focusin', onFocusIn)
      root.removeEventListener('click', onClick)
      root.removeEventListener('pointerdown', onRootPointerDown)
      document.removeEventListener('selectionchange', onSelectionChange)
      window.removeEventListener('scroll', onViewportChanged, true)
      window.removeEventListener('resize', onViewportChanged)
    }
  }, [
    blockMenuOpen,
    emitFromMedium,
    getBlockElementFromNode,
    normalizeBlocks,
    targetBlockId,
    updatePlusPosition,
  ])

  useEffect(() => {
    updatePlusPosition(targetBlockId)
  }, [targetBlockId, updatePlusPosition])

  const pasteHtml = useCallback(
    (fragment: string, blockId?: string | null) => {
      const ed = mediumRef.current
      if (!ed || disabled) return
      const root = editorRef.current
      editorRef.current?.focus()
      const sel = window.getSelection()
      const caretInsideRoot =
        root &&
        sel &&
        sel.rangeCount > 0 &&
        root.contains(sel.getRangeAt(0).commonAncestorContainer)
      if (!caretInsideRoot) {
        setCaretAfterBlock(blockId ?? pendingActionBlockRef.current)
        editorRef.current?.focus()
      }
      ed.pasteHTML(fragment)
      normalizeBlocks()
      emitFromMedium()
    },
    [disabled, emitFromMedium, normalizeBlocks, setCaretAfterBlock]
  )

  const onImageFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const image = event.target.files?.[0]
    event.target.value = ''
    if (!image) return
    if (disabled) return
    if (!image.type.startsWith('image/')) {
      toast.error('Lütfen bir görsel dosyası seçin')
      return
    }

    setIsUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', image)
      formData.append('prefix', 'blog/content')
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      })
      const body = (await response.json()) as UploadResponse
      if (!response.ok || !body.fileId) {
        throw new Error(body.details || body.error || 'Görsel yüklenemedi')
      }
      const alt = image.name.replace(/"/g, '&quot;')
      const fileViewUrl = `/api/files/${body.fileId}/view`
      setPendingImageSelectionFileId(body.fileId)
      pasteHtml(
        `<figure class="blog-me-media-block blog-content-media" data-blog-media="image" data-blog-width="100" data-blog-align="left" contenteditable="false"><img src="${fileViewUrl}" data-file-id="${body.fileId}" alt="${alt}" /></figure><p><br></p>`,
        pendingActionBlockRef.current
      )
      setMenuBlockId(null)
      onInlineImageInserted?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Görsel yüklenemedi')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const onVideoFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const video = event.target.files?.[0]
    event.target.value = ''
    if (!video) return

    setIsUploadingVideo(true)
    try {
      const formData = new FormData()
      formData.append('file', video)
      formData.append('prefix', 'blog/content/video')
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      })
      const body = (await response.json()) as UploadResponse
      if (!response.ok || !body.fileId) {
        throw new Error(body.details || body.error || 'Video yüklenemedi')
      }

      pasteHtml(
        `<figure class="blog-me-media-block blog-content-media" data-blog-media="video" data-blog-width="100" data-blog-align="left" contenteditable="false">${buildMediaEditorChromeHtml({ includeTrash: true })}<video controls data-file-id="${body.fileId}" src="/api/files/${body.fileId}/view"></video></figure><p><br></p>`,
        pendingActionBlockRef.current
      )
      setMenuBlockId(null)
      onInlineVideoInserted?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Video yüklenemedi')
    } finally {
      setIsUploadingVideo(false)
    }
  }

  const insertCodeBlock = useCallback(() => {
    pasteHtml(
      '<p><br></p><pre><code class="language-text">&nbsp;</code></pre><p><br></p>',
      pendingActionBlockRef.current
    )
    setMenuBlockId(null)
  }, [pasteHtml])

  const insertPart = useCallback(() => {
    pasteHtml(
      '<p><br></p><p data-blog-divider="true" contenteditable="false" aria-label="Ayırıcı">• • •</p><p><br></p>',
      pendingActionBlockRef.current
    )
    setMenuBlockId(null)
  }, [pasteHtml])

  const insertEmbed = useCallback(() => {
    const embedUrl = window.prompt('Embed URL')
    if (!embedUrl) return
    const safeUrl = embedUrl.trim()
    if (!safeUrl) return
    pasteHtml(
      `<p><a href="${safeUrl.replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer">${safeUrl.replace(/</g, '&lt;')}</a></p>`,
      pendingActionBlockRef.current
    )
    setMenuBlockId(null)
  }, [pasteHtml])

  const runBlockMenuAction = useCallback(
    (id: BlockMenuAction) => {
      switch (id) {
        case 'image':
          fileInputRef.current?.click()
          return
        case 'video':
          videoInputRef.current?.click()
          return
        case 'embed':
          insertEmbed()
          return
        case 'code':
          insertCodeBlock()
          return
        case 'divider':
          insertPart()
          return
        default: {
          const _exhaustive: never = id
          return _exhaustive
        }
      }
    },
    [insertCodeBlock, insertEmbed, insertPart]
  )

  const blockMenuUiItems = useMemo(
    () =>
      [
        {
          id: 'image',
          label: 'Görsel ekle',
          icon: ImagePlus,
          disabled: disabled || isUploadingImage,
        },
        {
          id: 'video',
          label: 'Video ekle',
          icon: Video,
          disabled: disabled || isUploadingVideo,
        },
        {
          id: 'embed',
          label: 'Embed ekle',
          icon: Plus,
          disabled,
        },
        {
          id: 'code',
          label: 'Kod bloğu ekle',
          icon: Braces,
          disabled,
        },
        {
          id: 'divider',
          label: 'Bölüm ayırıcı',
          icon: Minus,
          disabled,
        },
      ] satisfies Array<{
        id: BlockMenuAction
        label: string
        icon: typeof ImagePlus
        disabled: boolean
      }>,
    [disabled, isUploadingImage, isUploadingVideo]
  )

  const openBlockMenu = () => {
    if (!targetBlockId || disabled) return
    pendingActionBlockRef.current = targetBlockId
    setMenuBlockId(targetBlockId)
  }

  return (
    <div
      ref={hostRef}
      className={cn(
        'blog-me-shell rounded-lg border',
        disabled && 'pointer-events-none select-none opacity-60',
        className
      )}
    >
      <div className="p-3">
        <div className="blog-me-editor-wrap min-w-0 flex-1">
          {plusPosition && targetBlockId ? (
            <div
              className="blog-me-plus-overlay"
              style={{ top: plusPosition.top, left: plusPosition.left }}
            >
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8 rounded-full"
                disabled={disabled}
                aria-expanded={blockMenuOpen}
                aria-label="İçerik ekle"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  if (blockMenuOpen) {
                    setMenuBlockId(null)
                    return
                  }
                  openBlockMenu()
                }}
              >
                {blockMenuOpen ? (
                  <X className="size-4" />
                ) : (
                  <Plus className="size-4" />
                )}
              </Button>
            </div>
          ) : null}

          {blockMenuOpen && plusPosition ? (
            <div
              className="blog-me-action-menu"
              style={{
                top: plusPosition.top + 18,
                left: plusPosition.left + 40,
              }}
            >
              {blockMenuUiItems.map((action) => (
                <Button
                  key={action.id}
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-9 rounded-full"
                  disabled={action.disabled}
                  aria-label={action.label}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => runBlockMenuAction(action.id)}
                >
                  <action.icon className="size-4" />
                </Button>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 rounded-full"
                aria-label="Menüyü kapat"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setMenuBlockId(null)}
              >
                <Code2 className="size-4" />
              </Button>
            </div>
          ) : null}

          <div
            ref={editorRef}
            className="prose prose-sm dark:prose-invert max-w-none px-1 py-2"
          />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onImageFile}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={onVideoFile}
        className="hidden"
      />

      <Dialog
        open={cropModal !== null}
        onOpenChange={(open) => {
          if (!open) setCropModal(null)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Görseli kırp</DialogTitle>
            <DialogDescription>
              Alanı sürükleyin; yakınlaştırmayı kaydırıcıyla ayarlayın.
            </DialogDescription>
          </DialogHeader>
          {cropModal ? (
            <div className="space-y-4">
              <div className="bg-muted relative h-72 w-full overflow-hidden rounded-md">
                <Cropper
                  image={cropModal.imageSrc}
                  crop={cropState}
                  zoom={cropZoom}
                  onCropChange={setCropState}
                  onZoomChange={setCropZoom}
                  onCropComplete={(area) => {
                    setCropArea(area)
                  }}
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground shrink-0 text-xs">
                  Yakınlaştırma
                </span>
                <Slider
                  min={1}
                  max={3}
                  step={0.05}
                  value={[cropZoom]}
                  onValueChange={(v) => setCropZoom(v[0] ?? 1)}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter className="flex-wrap gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (cropModal) {
                  cropModal.figure.removeAttribute('data-blog-crop')
                  cropModal.img.style.removeProperty('clip-path')
                  cropModal.img.style.removeProperty('object-fit')
                  normalizeBlocks()
                  emitFromMedium()
                }
                setCropModal(null)
              }}
            >
              Kırpmayı kaldır
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCropModal(null)}
            >
              İptal
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!cropModal) return
                const area =
                  cropArea ??
                  ({ x: 0, y: 0, width: 100, height: 100 } satisfies Area)
                cropModal.figure.setAttribute(
                  'data-blog-crop',
                  JSON.stringify({
                    x: area.x,
                    y: area.y,
                    width: area.width,
                    height: area.height,
                  })
                )
                applyBlogCropToFigureImg(cropModal.figure)
                setCropModal(null)
                normalizeBlocks()
                emitFromMedium()
              }}
            >
              Uygula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
