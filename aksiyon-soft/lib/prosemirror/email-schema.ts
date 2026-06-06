import { Schema, NodeSpec, MarkSpec } from 'prosemirror-model'
import {
  nodes as basicNodes,
  marks as basicMarks,
} from 'prosemirror-schema-basic'
import { orderedList, bulletList, listItem } from 'prosemirror-schema-list'
import { tableNodes } from 'prosemirror-tables'

/**
 * Custom paragraph with text alignment
 */
const paragraphWithAlign: NodeSpec = {
  ...basicNodes.paragraph,
  attrs: {
    ...(basicNodes.paragraph.attrs || {}),
    align: { default: null },
  },
  toDOM(node) {
    const align = (node.attrs as { align?: string | null })?.align
    return ['p', align ? { style: `text-align: ${align}` } : {}, 0]
  },
  parseDOM: [
    {
      tag: 'p',
      getAttrs(dom) {
        if (typeof dom === 'string') return {}
        const element = dom as HTMLElement
        const align = element.style.textAlign || element.getAttribute('align')
        return align ? { align } : {}
      },
    },
    ...(Array.isArray(basicNodes.paragraph.parseDOM)
      ? basicNodes.paragraph.parseDOM
      : []),
  ],
}

/**
 * Font size mark
 */
const fontSizeMark: MarkSpec = {
  attrs: {
    size: { default: null },
  },
  toDOM(node) {
    const size = node.attrs.size
    return size ? ['span', { style: `font-size: ${size}` }, 0] : ['span', {}, 0]
  },
  parseDOM: [
    {
      style: 'font-size',
      getAttrs(value) {
        return { size: value }
      },
    },
    {
      tag: "span[style*='font-size']",
      getAttrs(dom) {
        if (typeof dom === 'string') return {}
        const element = dom as HTMLElement
        const size = element.style.fontSize
        return size ? { size } : {}
      },
    },
  ],
}

/**
 * Text color mark
 */
const textColorMark: MarkSpec = {
  attrs: {
    color: { default: null },
  },
  toDOM(node) {
    const color = node.attrs.color
    return color ? ['span', { style: `color: ${color}` }, 0] : ['span', {}, 0]
  },
  parseDOM: [
    {
      style: 'color',
      getAttrs(value) {
        return { color: value }
      },
    },
    {
      tag: "span[style*='color']",
      getAttrs(dom) {
        if (typeof dom === 'string') return {}
        const element = dom as HTMLElement
        const color = element.style.color
        return color ? { color } : {}
      },
    },
  ],
}

/**
 * Highlight / background color mark
 */
const highlightMark: MarkSpec = {
  attrs: {
    color: { default: null },
  },
  toDOM(node) {
    const color = node.attrs.color
    return color
      ? [
          'span',
          { class: 'pm-highlight', style: `background-color: ${color};` },
          0,
        ]
      : ['span', { class: 'pm-highlight' }, 0]
  },
  parseDOM: [
    {
      style: 'background-color',
      getAttrs(value) {
        return { color: value }
      },
    },
    {
      tag: "span[style*='background-color']",
      getAttrs(dom) {
        if (typeof dom === 'string') return {}
        const element = dom as HTMLElement
        const color = element.style.backgroundColor
        return color ? { color } : {}
      },
    },
  ],
}

/**
 * Image node with alignment support and CID for inline attachments
 */
const imageNode: NodeSpec = {
  inline: false,
  attrs: {
    src: { default: '' },
    alt: { default: '' },
    title: { default: '' },
    width: { default: null },
    height: { default: null },
    align: { default: 'left' },
    cid: { default: null }, // Content-ID for inline attachments
    previewUrl: { default: null }, // Preview URL for browser display
  },
  group: 'block',
  draggable: true,
  toDOM(node) {
    const align = node.attrs.align || 'left'
    const width = node.attrs.width
    const height = node.attrs.height
    const src = node.attrs.src
    const cid = node.attrs.cid
    const previewUrl = node.attrs.previewUrl

    // Build style string
    let style = 'max-width: 100%; height: auto;'
    if (width) style += ` width: ${width};`
    if (height) style += ` height: ${height};`

    // Alignment wrapper
    let wrapperStyle = 'margin: 1em 0;'
    if (align === 'center') {
      wrapperStyle += ' text-align: center;'
    } else if (align === 'right') {
      wrapperStyle += ' text-align: right;'
    }

    // Use previewUrl for browser display, but keep cid for email
    // In email context, we'll replace previewUrl with cid: format
    const imgSrc = previewUrl || (cid ? `cid:${cid}` : src)

    return [
      'div',
      {
        class: `pm-image-wrapper pm-image-align-${align}`,
        style: wrapperStyle,
      },
      [
        'img',
        {
          src: imgSrc,
          alt: node.attrs.alt,
          title: node.attrs.title,
          style,
          'data-width': width || '',
          'data-height': height || '',
          'data-align': align,
          'data-cid': cid || '',
          'data-preview-url': previewUrl || '',
        },
      ],
    ]
  },
  parseDOM: [
    {
      tag: 'div.pm-image-wrapper',
      getAttrs(dom) {
        if (typeof dom === 'string') return {}
        const wrapper = dom as HTMLElement
        const img = wrapper.querySelector('img')
        if (!img) return {}
        const src = img.getAttribute('src') || ''
        const previewUrl = img.getAttribute('data-preview-url')
        // Extract CID from src if it's in cid:xxx format
        const cidMatch = src.match(/^cid:(.+)$/)
        const cid = cidMatch ? cidMatch[1] : img.getAttribute('data-cid')
        return {
          src: cid ? `cid:${cid}` : src, // Keep CID format for email
          alt: img.getAttribute('alt') || '',
          title: img.getAttribute('title') || '',
          width:
            img.getAttribute('data-width') || img.getAttribute('width') || null,
          height:
            img.getAttribute('data-height') ||
            img.getAttribute('height') ||
            null,
          align: img.getAttribute('data-align') || 'left',
          cid: cid || null,
          previewUrl: previewUrl || null,
        }
      },
    },
    {
      tag: 'img[src]',
      getAttrs(dom) {
        if (typeof dom === 'string') return {}
        const element = dom as HTMLElement
        const src = element.getAttribute('src') || ''
        const previewUrl = element.getAttribute('data-preview-url')
        const cidMatch = src.match(/^cid:(.+)$/)
        const cid = cidMatch ? cidMatch[1] : element.getAttribute('data-cid')
        return {
          src: cid ? `cid:${cid}` : src,
          alt: element.getAttribute('alt') || '',
          title: element.getAttribute('title') || '',
          width: element.getAttribute('width'),
          height: element.getAttribute('height'),
          align: element.getAttribute('data-align') || 'left',
          cid: cid || null,
          previewUrl: previewUrl || null,
        }
      },
    },
  ],
}

/**
 * Table nodes from prosemirror-tables with custom style attributes
 */
const baseTableNodeSpecs = tableNodes({
  tableGroup: 'block',
  cellContent: 'block+',
  cellAttributes: {
    background: {
      default: null,
      getFromDOM(dom) {
        return (dom as HTMLElement).style.backgroundColor || null
      },
      setDOMAttr(value, attrs) {
        if (value) {
          ;(attrs as Record<string, string>).style =
            ((attrs as Record<string, string>).style || '') +
            `background-color: ${value};`
        }
      },
    },
  },
})

/**
 * Custom table node with style attributes
 */
const customTableNode: NodeSpec = {
  ...baseTableNodeSpecs.table,
  attrs: {
    ...(baseTableNodeSpecs.table.attrs || {}),
    borderStyle: { default: 'solid' },
    headerBackground: { default: '#f0f0f0' },
  },
  toDOM(node) {
    const borderStyle = node.attrs.borderStyle || 'solid'
    const headerBg = node.attrs.headerBackground || '#f0f0f0'

    return [
      'table',
      {
        class: `pm-table pm-table-border-${borderStyle}`,
        'data-border-style': borderStyle,
        'data-header-bg': headerBg,
        style: `--table-header-bg: ${headerBg === 'transparent' ? 'transparent' : headerBg};`,
      },
      ['tbody', 0],
    ]
  },
  parseDOM: [
    {
      tag: 'table',
      getAttrs(dom) {
        const el = dom as HTMLElement
        return {
          borderStyle: el.getAttribute('data-border-style') || 'solid',
          headerBackground: el.getAttribute('data-header-bg') || '#f0f0f0',
        }
      },
    },
  ],
}

/**
 * Email-specific ProseMirror schema
 * No page nodes, just block/inline content suitable for emails
 */
export const emailSchema = new Schema({
  nodes: {
    ...basicNodes,
    doc: {
      ...basicNodes.doc,
      content: 'block+',
    },
    paragraph: paragraphWithAlign,
    image: imageNode,
    ordered_list: orderedList,
    bullet_list: bulletList,
    list_item: listItem,
    // Table nodes
    table: customTableNode,
    table_row: baseTableNodeSpecs.table_row,
    table_cell: baseTableNodeSpecs.table_cell,
    table_header: baseTableNodeSpecs.table_header,
  },
  marks: {
    ...basicMarks,
    font_size: fontSizeMark,
    text_color: textColorMark,
    highlight: highlightMark,
  },
})

export type EmailSchema = typeof emailSchema
