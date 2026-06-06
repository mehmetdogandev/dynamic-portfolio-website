'use client'

import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
} from 'react'
import { EditorView } from 'prosemirror-view'
import { EditorState } from 'prosemirror-state'
import { Node, DOMParser } from 'prosemirror-model'
import { emailSchema } from '@/lib/prosemirror/email-schema'
import { history, undo, redo } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap, toggleMark } from 'prosemirror-commands'
import { wrapInList } from 'prosemirror-schema-list'
import {
  insertTable,
  setTextAlign,
  setTextColor,
  setHighlightColor,
  setImageAlign,
  setImageSize,
} from '@/lib/prosemirror/commands'
import { Plugin } from 'prosemirror-state'
import { tableEditing, goToNextCell } from 'prosemirror-tables'
import { DOMSerializer } from 'prosemirror-model'
import type { AttachmentMetadata } from './attachment-manager'
import { ImageEditorDialog } from '@/components/ui/image-editor-dialog'
import { useTRPC } from '@/lib/trpc/client'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface InlineImageMetadata extends AttachmentMetadata {
  cid: string
  bucket?: string
}

export interface EmailRichTextEditorRef {
  view: EditorView | null
  toggleBold: () => void
  toggleItalic: () => void
  toggleUnderline: () => void
  toggleBulletList: () => void
  toggleOrderedList: () => void
  setTextAlign: (align: 'left' | 'center' | 'right' | 'justify' | null) => void
  setTextColor: (color: string | null) => void
  setHighlightColor: (color: string | null) => void
  insertImage: (
    attachment: AttachmentMetadata,
    alt?: string,
    width?: string,
    height?: string,
    align?: 'left' | 'center' | 'right'
  ) => void
  setImageAlign: (align: 'left' | 'center' | 'right') => void
  updateImageSize: (width: string | null, height: string | null) => void
  insertTable: (rows?: number, cols?: number, withHeaderRow?: boolean) => void
  undo: () => void
  redo: () => void
  getInlineImages: () => InlineImageMetadata[]
  getSelectedImage: () => Node | null
}

interface EmailRichTextEditorProps {
  value: string // HTML string
  onChange: (html: string, inlineImages: InlineImageMetadata[]) => void
  placeholder?: string
  className?: string
}

export const EmailRichTextEditor = forwardRef<
  EmailRichTextEditorRef,
  EmailRichTextEditorProps
>(
  (
    {
      value,
      onChange,
      placeholder = 'E-posta içeriğini buraya yazın...',
      className,
    },
    ref
  ) => {
    const editorRef = useRef<HTMLDivElement>(null)
    const viewRef = useRef<EditorView | null>(null)
    const isInternalUpdateRef = useRef(false)
    const inlineImagesMapRef = useRef<Map<string, InlineImageMetadata>>(
      new Map()
    )
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
    const [showCropDialog, setShowCropDialog] = useState(false)
    const [cropImageCid, setCropImageCid] = useState<string | null>(null)
    const [cropImagePos, setCropImagePos] = useState<number | null>(null)
    const resizeStateRef = useRef<{
      isResizing: boolean
      handle: string | null
      startX: number
      startY: number
      startWidth: number
      startHeight: number
      imagePos: number | null
    }>({
      isResizing: false,
      handle: null,
      startX: 0,
      startY: 0,
      startWidth: 0,
      startHeight: 0,
      imagePos: null,
    })
    const trpc = useTRPC()

    const uploadMutation = useMutation(
      trpc.mail.uploadAttachment.mutationOptions()
    )

    // Generate CID from UUID
    const generateCID = (): string => {
      return `img-${crypto.randomUUID()}`
    }

    // Extract inline images from HTML and populate map
    const extractInlineImages = (html: string): void => {
      if (!html) return

      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = html
      const images = tempDiv.querySelectorAll('img[data-cid], img[src^="cid:"]')

      images.forEach((img) => {
        const cidAttr = img.getAttribute('data-cid')
        const src = img.getAttribute('src') || ''
        const cidMatch = src.match(/^cid:(.+)$/)
        const cid = cidAttr || (cidMatch ? cidMatch[1] : null)

        if (cid) {
          // Try to find existing metadata or create placeholder
          const existing = inlineImagesMapRef.current.get(cid)
          if (!existing) {
            // This is a placeholder - will be filled when image is inserted
            inlineImagesMapRef.current.set(cid, {
              cid,
              fileName: '',
              originalName: '',
              path: '',
              size: 0,
              mimeType: 'image/jpeg',
            })
          }
        }
      })
    }

    // Convert HTML to ProseMirror document
    const htmlToDoc = (html: string): Node => {
      if (!html || html.trim() === '') {
        return emailSchema.node('doc', {}, [emailSchema.node('paragraph')])
      }

      // Extract inline images and store their metadata
      extractInlineImages(html)

      // Create a temporary DOM element to parse HTML
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = html

      return DOMParser.fromSchema(emailSchema).parse(tempDiv)
    }

    // Convert ProseMirror document to HTML (client-safe, no jsdom)
    const docToHtml = (doc: Node): string => {
      if (typeof document === 'undefined') return ''
      const serializer = DOMSerializer.fromSchema(emailSchema)
      const fragment = serializer.serializeFragment(doc.content, { document })
      const tempContainer = document.createElement('div')
      tempContainer.appendChild(fragment)
      return tempContainer.innerHTML
    }

    // Initialize editor
    useEffect(() => {
      if (!editorRef.current) return

      // Create initial document from HTML
      const doc = htmlToDoc(value)

      // Create editor state
      const state = EditorState.create({
        doc,
        plugins: [
          history(),
          keymap({
            ...baseKeymap,
            'Mod-z': undo,
            'Mod-y': redo,
            'Shift-Mod-z': redo,
            Tab: goToNextCell(1),
            'Shift-Tab': goToNextCell(-1),
          }),
          tableEditing(),
          // Image selection plugin - adds visual feedback for selected images
          new Plugin({
            view(view) {
              const updateSelection = () => {
                // Use setTimeout to ensure DOM is updated
                setTimeout(() => {
                  // Remove selected class from all images
                  if (view.dom) {
                    const allWrappers =
                      view.dom.querySelectorAll('.pm-image-wrapper')
                    allWrappers.forEach((wrapper) => {
                      wrapper.classList.remove('selected')
                    })
                  }

                  // Add selected class to currently selected image
                  const { selection } = view.state
                  const { $from } = selection
                  const node = $from.node()
                  if (node && node.type.name === 'image') {
                    try {
                      const pos = $from.before($from.depth)
                      const dom = view.nodeDOM(pos)
                      if (dom && dom instanceof HTMLElement) {
                        const wrapper = dom.closest('.pm-image-wrapper')
                        if (wrapper) {
                          wrapper.classList.add('selected')
                        }
                      }
                    } catch (_e) {
                      // Fallback: find image wrapper by traversing DOM
                      const allWrappers =
                        view.dom.querySelectorAll('.pm-image-wrapper')
                      allWrappers.forEach((wrapper) => {
                        const img = wrapper.querySelector('img')
                        if (
                          img &&
                          img.getAttribute('data-cid') === node.attrs.cid
                        ) {
                          wrapper.classList.add('selected')
                        }
                      })
                    }
                  }
                }, 0)
              }

              return {
                update(view, prevState) {
                  if (prevState.selection.eq(view.state.selection)) return
                  updateSelection()
                },
                destroy() {
                  // Cleanup
                },
              }
            },
          }),
          // Resize plugin for images
          new Plugin({
            props: {
              handleDOMEvents: {
                mousedown(view, event) {
                  const target = event.target as HTMLElement
                  if (target.classList.contains('resize-handle')) {
                    event.preventDefault()
                    const wrapper = target.closest('.pm-image-wrapper')
                    if (!wrapper) return false

                    const img = wrapper.querySelector('img')
                    if (!img) return false

                    const rect = img.getBoundingClientRect()
                    const handle = target.getAttribute('data-handle') || ''
                    const startX = event.clientX
                    const startY = event.clientY
                    const startWidth = rect.width
                    const startHeight = rect.height

                    // Find image position by traversing DOM
                    let imagePos: number | null = null
                    const cid = img.getAttribute('data-cid')

                    if (cid) {
                      view.state.doc.descendants((node, pos) => {
                        if (node.type.name === 'image' && !imagePos) {
                          if (node.attrs.cid === cid) {
                            imagePos = pos
                          }
                        }
                      })
                    }

                    if (imagePos === null) {
                      // Fallback: try to find by DOM position
                      view.state.doc.descendants((node, pos) => {
                        if (node.type.name === 'image' && !imagePos) {
                          const dom = view.nodeDOM(pos)
                          if (dom && wrapper.contains(dom)) {
                            imagePos = pos
                          }
                        }
                      })
                    }

                    if (imagePos === null) return false

                    resizeStateRef.current = {
                      isResizing: true,
                      handle,
                      startX,
                      startY,
                      startWidth,
                      startHeight,
                      imagePos,
                    }

                    const onMouseMove = (e: MouseEvent) => {
                      if (!resizeStateRef.current.isResizing) return

                      const {
                        handle,
                        startX,
                        startY,
                        startWidth,
                        startHeight,
                      } = resizeStateRef.current

                      if (!handle) return

                      const deltaX = e.clientX - startX
                      const deltaY = e.clientY - startY

                      let newWidth = startWidth
                      let newHeight = startHeight

                      if (handle.includes('e')) {
                        newWidth = Math.max(50, startWidth + deltaX)
                      }
                      if (handle.includes('w')) {
                        newWidth = Math.max(50, startWidth - deltaX)
                      }
                      if (handle.includes('s')) {
                        newHeight = Math.max(50, startHeight + deltaY)
                      }
                      if (handle.includes('n')) {
                        newHeight = Math.max(50, startHeight - deltaY)
                      }

                      // Maintain aspect ratio for corner handles
                      if (handle.length === 2) {
                        const aspectRatio = startWidth / startHeight
                        if (handle.includes('e') || handle.includes('w')) {
                          newHeight = newWidth / aspectRatio
                        } else {
                          newWidth = newHeight * aspectRatio
                        }
                      }

                      img.style.width = `${newWidth}px`
                      img.style.height = `${newHeight}px`
                    }

                    const onMouseUp = () => {
                      if (!resizeStateRef.current.isResizing) return

                      const { imagePos } = resizeStateRef.current
                      const img = wrapper.querySelector('img')
                      if (!img || imagePos === null) return

                      // Get computed dimensions
                      const computedStyle = window.getComputedStyle(img)
                      const computedWidth =
                        computedStyle.width ||
                        img.style.width ||
                        img.getAttribute('width') ||
                        ''
                      const computedHeight =
                        computedStyle.height ||
                        img.style.height ||
                        img.getAttribute('height') ||
                        ''

                      // Extract numeric value (remove 'px', 'em', etc.)
                      const width = computedWidth
                        ? computedWidth.replace(/[^\d.]/g, '')
                        : null
                      const height = computedHeight
                        ? computedHeight.replace(/[^\d.]/g, '')
                        : null

                      // Clear inline styles to use attribute-based sizing
                      img.style.width = ''
                      img.style.height = ''

                      const { state, dispatch } = view
                      const command = setImageSize(width, height)
                      command(state, dispatch)

                      // Force re-render to update handles
                      setTimeout(() => {
                        const wrapper = img.closest('.pm-image-wrapper')
                        if (wrapper) {
                          wrapper.classList.add('selected')
                        }
                      }, 0)

                      resizeStateRef.current.isResizing = false
                      document.removeEventListener('mousemove', onMouseMove)
                      document.removeEventListener('mouseup', onMouseUp)
                    }

                    document.addEventListener('mousemove', onMouseMove)
                    document.addEventListener('mouseup', onMouseUp)

                    return true
                  }

                  // Double click to crop
                  if (event.detail === 2) {
                    const target = event.target as HTMLElement
                    const img = target.closest('img')
                    if (img && img.closest('.pm-image-wrapper')) {
                      event.preventDefault()
                      const src = img.getAttribute('src') || ''
                      const cid = img.getAttribute('data-cid') || ''

                      // Find image position
                      let imagePos: number | null = null
                      if (cid) {
                        view.state.doc.descendants((node, pos) => {
                          if (node.type.name === 'image' && !imagePos) {
                            if (node.attrs.cid === cid) {
                              imagePos = pos
                            }
                          }
                        })
                      }

                      // Use preview URL or src
                      const previewUrl =
                        img.getAttribute('data-preview-url') || src
                      const imageSrc =
                        previewUrl.startsWith('/api/files/') ||
                        previewUrl.startsWith('http')
                          ? previewUrl
                          : src.startsWith('cid:')
                            ? null // Can't crop CID images directly, need preview URL
                            : src

                      if (imageSrc && imagePos !== null) {
                        setCropImageSrc(imageSrc)
                        setCropImageCid(cid)
                        setCropImagePos(imagePos)
                        setShowCropDialog(true)
                      } else {
                        toast.error(
                          'Görsel kırpılamaz - lütfen görseli tekrar yükleyin'
                        )
                      }
                      return true
                    }
                  }

                  return false
                },
              },
            },
            view(view) {
              const addResizeHandles = () => {
                if (!view.dom) return

                const wrappers = view.dom.querySelectorAll('.pm-image-wrapper')
                wrappers.forEach((wrapper) => {
                  // Remove existing handles
                  const existingHandles =
                    wrapper.querySelector('.resize-handles')
                  if (existingHandles) {
                    existingHandles.remove()
                  }

                  // Only add handles to selected images
                  if (wrapper.classList.contains('selected')) {
                    const handles = document.createElement('div')
                    handles.className = 'resize-handles'
                    handles.innerHTML = `
                      <div class="resize-handle" data-handle="nw"></div>
                      <div class="resize-handle" data-handle="ne"></div>
                      <div class="resize-handle" data-handle="sw"></div>
                      <div class="resize-handle" data-handle="se"></div>
                      <div class="resize-handle" data-handle="n"></div>
                      <div class="resize-handle" data-handle="s"></div>
                      <div class="resize-handle" data-handle="e"></div>
                      <div class="resize-handle" data-handle="w"></div>
                    `
                    wrapper.appendChild(handles)
                  }
                })
              }

              return {
                update(view, prevState) {
                  // Update handles when selection changes
                  if (!prevState.selection.eq(view.state.selection)) {
                    setTimeout(addResizeHandles, 10)
                  } else {
                    setTimeout(addResizeHandles, 0)
                  }
                },
                destroy() {
                  // Cleanup
                  if (view.dom) {
                    const handles = view.dom.querySelectorAll('.resize-handles')
                    handles.forEach((handle) => handle.remove())
                  }
                },
              }
            },
          }),
          // Update handler plugin
          new Plugin({
            view() {
              return {
                update(view, prevState) {
                  if (isInternalUpdateRef.current) return
                  if (prevState.doc.eq(view.state.doc)) return

                  const html = docToHtml(view.state.doc)
                  const inlineImages = Array.from(
                    inlineImagesMapRef.current.values()
                  )
                  onChange(html, inlineImages)
                },
              }
            },
          }),
        ],
      })

      // Create editor view
      const view = new EditorView(editorRef.current, {
        state,
        dispatchTransaction(transaction) {
          const newState = view.state.apply(transaction)
          view.updateState(newState)
        },
      })

      viewRef.current = view

      return () => {
        view.destroy()
        viewRef.current = null
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Only run once on mount

    // Update editor when value changes externally
    useEffect(() => {
      if (!viewRef.current || isInternalUpdateRef.current) return

      const currentHtml = docToHtml(viewRef.current.state.doc)
      if (currentHtml === value) return

      const newDoc = htmlToDoc(value)
      const newState = EditorState.create({
        doc: newDoc,
        plugins: viewRef.current.state.plugins,
      })

      isInternalUpdateRef.current = true
      viewRef.current.updateState(newState)
      setTimeout(() => {
        isInternalUpdateRef.current = false
      }, 0)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]) // Only depend on value, htmlToDoc is stable

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      view: viewRef.current,
      toggleBold: () => {
        if (!viewRef.current) return
        const { state, dispatch } = viewRef.current
        const command = toggleMark(emailSchema.marks.strong)
        command(state, dispatch)
      },
      toggleItalic: () => {
        if (!viewRef.current) return
        const { state, dispatch } = viewRef.current
        const command = toggleMark(emailSchema.marks.em)
        command(state, dispatch)
      },
      toggleUnderline: () => {
        if (!viewRef.current) return
        // Underline is not in basic marks, we'll use a custom mark or style
        // For now, use text decoration via CSS
        document.execCommand('underline', false)
      },
      toggleBulletList: () => {
        if (!viewRef.current) return
        const { state, dispatch } = viewRef.current
        const command = wrapInList(emailSchema.nodes.bullet_list)
        command(state, dispatch)
      },
      toggleOrderedList: () => {
        if (!viewRef.current) return
        const { state, dispatch } = viewRef.current
        const command = wrapInList(emailSchema.nodes.ordered_list)
        command(state, dispatch)
      },
      setTextAlign: (align: 'left' | 'center' | 'right' | 'justify' | null) => {
        if (!viewRef.current) return
        const { state, dispatch } = viewRef.current
        const command = setTextAlign(align)
        command(state, dispatch)
      },
      setTextColor: (color: string | null) => {
        if (!viewRef.current) return
        const { state, dispatch } = viewRef.current
        const command = setTextColor(color)
        command(state, dispatch)
      },
      setHighlightColor: (color: string | null) => {
        if (!viewRef.current) return
        const { state, dispatch } = viewRef.current
        const command = setHighlightColor(color)
        command(state, dispatch)
      },
      insertImage: (
        attachment: AttachmentMetadata,
        alt?: string,
        width?: string,
        height?: string,
        align?: 'left' | 'center' | 'right'
      ) => {
        if (!viewRef.current) return
        const { state, dispatch } = viewRef.current

        // Generate CID
        const cid = generateCID()

        // Create preview URL from fileId if available
        const previewUrl = attachment.fileId
          ? `/api/files/${attachment.fileId}/view`
          : attachment.url || null

        // Store image metadata
        const inlineImage: InlineImageMetadata = {
          ...attachment,
          cid,
        }
        inlineImagesMapRef.current.set(cid, inlineImage)

        // Insert image node with CID and previewUrl attributes
        const { schema } = state
        const imageNode = schema.nodes.image
        if (!imageNode) return

        const image = imageNode.create({
          src: `cid:${cid}`,
          alt: alt || '',
          title: attachment.originalName,
          width: width || null,
          height: height || null,
          align: align || 'left',
          cid: cid,
          previewUrl: previewUrl,
        })

        const tr = state.tr.replaceSelectionWith(image)
        dispatch(tr)
      },
      setImageAlign: (align: 'left' | 'center' | 'right') => {
        if (!viewRef.current) return
        const { state, dispatch } = viewRef.current
        const command = setImageAlign(align)
        command(state, dispatch)
      },
      getSelectedImage: () => {
        if (!viewRef.current) return null
        const { selection } = viewRef.current.state
        const { $from } = selection
        const node = $from.node()
        if (node && node.type.name === 'image') {
          return node
        }
        return null
      },
      updateImageSize: (width: string | null, height: string | null) => {
        if (!viewRef.current) return
        const { state, dispatch } = viewRef.current
        const command = setImageSize(width, height)
        command(state, dispatch)
      },
      insertTable: (
        rows: number = 3,
        cols: number = 3,
        withHeaderRow: boolean = true
      ) => {
        if (!viewRef.current) return
        const { state, dispatch } = viewRef.current
        const command = insertTable(rows, cols, withHeaderRow, {})
        command(state, dispatch)
      },
      undo: () => {
        if (!viewRef.current) return
        const { state, dispatch } = viewRef.current
        undo(state, dispatch)
      },
      redo: () => {
        if (!viewRef.current) return
        const { state, dispatch } = viewRef.current
        redo(state, dispatch)
      },
      getInlineImages: () => {
        return Array.from(inlineImagesMapRef.current.values())
      },
    }))

    const handleCropSave = async (file: File) => {
      try {
        // Convert file to base64
        const reader = new FileReader()
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string
            const base64 = result.split(',')[1]
            resolve(base64)
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        const result = await uploadMutation.mutateAsync({
          file: base64,
          fileName: file.name,
          mimeType: file.type,
        })

        // Update the current image with the cropped version
        if (!viewRef.current || cropImagePos === null) {
          toast.error('Görsel bulunamadı')
          return
        }

        const { state, dispatch } = viewRef.current
        const node = state.doc.nodeAt(cropImagePos)

        if (!node || node.type.name !== 'image') {
          toast.error('Görsel bulunamadı')
          return
        }

        const previewUrl = result.fileId
          ? `/api/files/${result.fileId}/view`
          : result.url || null

        // Use existing CID or generate new one
        const cid = cropImageCid || node.attrs.cid || generateCID()

        // Remove old image from map if CID changed
        if (cropImageCid && cropImageCid !== cid) {
          inlineImagesMapRef.current.delete(cropImageCid)
        }

        // Store/update image metadata
        const inlineImage: InlineImageMetadata = {
          ...result,
          cid: cid,
        }
        inlineImagesMapRef.current.set(cid, inlineImage)

        // Update image node - replace with cropped version
        const attrs = {
          ...node.attrs,
          src: `cid:${cid}`,
          cid: cid,
          previewUrl: previewUrl,
          // Preserve alignment and size
          align: node.attrs.align,
          width: node.attrs.width,
          height: node.attrs.height,
        }

        const tr = state.tr.setNodeMarkup(cropImagePos, undefined, attrs)
        dispatch(tr)

        toast.success('Görsel kırpıldı ve güncellendi')
        setShowCropDialog(false)
        setCropImageSrc(null)
        setCropImageCid(null)
        setCropImagePos(null)
      } catch (error) {
        toast.error('Görsel yüklenirken hata oluştu')
        console.error('Crop save error:', error)
      }
    }

    return (
      <>
        <div className={`border rounded-lg overflow-hidden ${className || ''}`}>
          <div
            ref={editorRef}
            className="min-h-[300px] p-4 prose prose-sm max-w-none dark:prose-invert focus:outline-none"
            style={
              {
                // Placeholder styling
              }
            }
            data-placeholder={placeholder}
          />
          <style>{`
        [data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .ProseMirror {
          outline: none;
        }
        .ProseMirror .pm-image-wrapper {
          margin: 1em 0;
          position: relative;
          display: inline-block;
          max-width: 100%;
        }
        .ProseMirror .pm-image-wrapper img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 2px solid transparent;
          transition: all 0.2s ease;
          display: block;
        }
        .ProseMirror .pm-image-wrapper:hover img {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .ProseMirror .pm-image-wrapper.ProseMirror-selectednode img,
        .ProseMirror .pm-image-wrapper.selected img {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .ProseMirror .pm-image-wrapper {
          position: relative;
          display: inline-block;
        }
        .ProseMirror .pm-image-wrapper.selected .resize-handles {
          display: block !important;
        }
        .ProseMirror .resize-handles {
          display: none;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 100;
        }
        .ProseMirror .resize-handle {
          position: absolute;
          background: #3b82f6;
          border: 2px solid white;
          width: 12px;
          height: 12px;
          pointer-events: all;
          cursor: nwse-resize;
          z-index: 10;
        }
        .ProseMirror .resize-handle[data-handle="nw"] {
          top: -6px;
          left: -6px;
          cursor: nwse-resize;
        }
        .ProseMirror .resize-handle[data-handle="ne"] {
          top: -6px;
          right: -6px;
          cursor: nesw-resize;
        }
        .ProseMirror .resize-handle[data-handle="sw"] {
          bottom: -6px;
          left: -6px;
          cursor: nesw-resize;
        }
        .ProseMirror .resize-handle[data-handle="se"] {
          bottom: -6px;
          right: -6px;
          cursor: nwse-resize;
        }
        .ProseMirror .resize-handle[data-handle="n"] {
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
          cursor: ns-resize;
        }
        .ProseMirror .resize-handle[data-handle="s"] {
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          cursor: ns-resize;
        }
        .ProseMirror .resize-handle[data-handle="e"] {
          right: -6px;
          top: 50%;
          transform: translateY(-50%);
          cursor: ew-resize;
        }
        .ProseMirror .resize-handle[data-handle="w"] {
          left: -6px;
          top: 50%;
          transform: translateY(-50%);
          cursor: ew-resize;
        }
        .ProseMirror .pm-image-wrapper img {
          cursor: pointer;
        }
        .ProseMirror .pm-image-align-left {
          text-align: left;
        }
        .ProseMirror .pm-image-align-center {
          text-align: center;
        }
        .ProseMirror .pm-image-align-right {
          text-align: right;
        }
        .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }
        .ProseMirror table td,
        .ProseMirror table th {
          border: 1px solid #ccc;
          padding: 8px;
        }
        .ProseMirror table th {
          background-color: #f0f0f0;
        }
      `}</style>
        </div>

        {/* Crop Dialog */}
        {cropImageSrc && (
          <ImageEditorDialog
            open={showCropDialog}
            onOpenChange={(open) => {
              setShowCropDialog(open)
              if (!open) {
                setCropImageSrc(null)
                setCropImageCid(null)
                setCropImagePos(null)
              }
            }}
            imageSrc={cropImageSrc}
            onSave={handleCropSave}
          />
        )}
      </>
    )
  }
)

EmailRichTextEditor.displayName = 'EmailRichTextEditor'
