import { Schema, NodeSpec, MarkSpec } from 'prosemirror-model'
import {
  nodes as basicNodes,
  marks as basicMarks,
} from 'prosemirror-schema-basic'
import { orderedList, bulletList, listItem } from 'prosemirror-schema-list'
import { tableNodes } from 'prosemirror-tables'

/**
 * Page node - represents a single page in the document
 */
const pageNode: NodeSpec = {
  content: 'page_content',
  group: 'block',
  defining: true,
  attrs: {
    marginTop: { default: '20mm' },
    marginBottom: { default: '20mm' },
    marginLeft: { default: '20mm' },
    marginRight: { default: '20mm' },
    size: { default: 'A4' },
    orientation: { default: 'portrait' }, // "portrait" | "landscape"
    fontFamily: { default: 'Arial, sans-serif' },
    fontSize: { default: '12pt' },
    lineHeight: { default: null },
  },
  toDOM(node) {
    const lineHeightStyle = node.attrs.lineHeight
      ? `line-height: ${node.attrs.lineHeight};`
      : ''
    const fontSizeStyle = node.attrs.fontSize
      ? `font-size: ${node.attrs.fontSize};`
      : ''
    return [
      'div',
      {
        class: 'pm-page',
        'data-orientation': node.attrs.orientation,
        'data-font-family': node.attrs.fontFamily,
        'data-font-size': node.attrs.fontSize || '',
        'data-line-height': node.attrs.lineHeight || '',
        style: `
					padding-top: ${node.attrs.marginTop};
					padding-bottom: ${node.attrs.marginBottom};
					padding-left: ${node.attrs.marginLeft};
					padding-right: ${node.attrs.marginRight};
					font-family: ${node.attrs.fontFamily};
					${fontSizeStyle}
					${lineHeightStyle}
				`,
      },
      0,
    ]
  },
  parseDOM: [
    {
      tag: 'div.pm-page',
      getAttrs(dom) {
        if (typeof dom === 'string') return {}
        const element = dom as HTMLElement
        return {
          marginTop: element.style.paddingTop || '20mm',
          marginBottom: element.style.paddingBottom || '20mm',
          marginLeft: element.style.paddingLeft || '20mm',
          marginRight: element.style.paddingRight || '20mm',
          size: element.getAttribute('data-size') || 'A4',
          orientation: element.getAttribute('data-orientation') || 'portrait',
          fontFamily:
            element.getAttribute('data-font-family') ||
            element.style.fontFamily ||
            'Arial, sans-serif',
          fontSize:
            element.getAttribute('data-font-size') ||
            element.style.fontSize ||
            '12pt',
          lineHeight:
            element.getAttribute('data-line-height') ||
            element.style.lineHeight ||
            null,
        }
      },
    },
  ],
}

/**
 * Page content node - main content area
 */
const pageContentNode: NodeSpec = {
  content: 'block+',
  group: 'block',
  toDOM() {
    return ['div', { class: 'pm-content' }, 0]
  },
  parseDOM: [{ tag: 'div.pm-content' }],
}

/**
 * Page break node - visual separator for page breaks
 */
const pageBreakNode: NodeSpec = {
  group: 'block',
  atom: true,
  toDOM() {
    return ['div', { class: 'pm-page-break' }]
  },
  parseDOM: [{ tag: 'div.pm-page-break' }],
}

/**
 * Placeholder node - merge field (e.g., {{ personal.name }})
 */
const placeholderNode: NodeSpec = {
  inline: true,
  atom: true,
  group: 'inline',
  attrs: {
    key: { default: '' },
  },
  toDOM(node) {
    // For inline atom nodes, return array format: [tag, attrs, content]
    // The text content is the third element
    return ['span', { class: 'pm-placeholder' }, `{{ ${node.attrs.key} }}`]
  },
  parseDOM: [
    {
      tag: 'span.pm-placeholder',
      getAttrs(dom) {
        if (typeof dom === 'string') return { key: '' }
        const element = dom as HTMLElement
        const text = element.textContent || ''
        // Extract key from {{ key }} format
        const match = text.match(/\{\{\s*(.+?)\s*\}\}/)
        return {
          key: match ? match[1] : '',
        }
      },
    },
  ],
}

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
 * Line height mark
 */
const lineHeightMark: MarkSpec = {
  attrs: {
    height: { default: null },
  },
  toDOM(node) {
    const height = node.attrs.height
    return height
      ? ['span', { style: `line-height: ${height}` }, 0]
      : ['span', {}, 0]
  },
  parseDOM: [
    {
      style: 'line-height',
      getAttrs(value) {
        return { height: value }
      },
    },
    {
      tag: "span[style*='line-height']",
      getAttrs(dom) {
        if (typeof dom === 'string') return {}
        const element = dom as HTMLElement
        const height = element.style.lineHeight
        return height ? { height } : {}
      },
    },
  ],
}

/**
 * Image node with alignment support
 */
const imageNode: NodeSpec = {
  inline: false, // Changed to block for alignment support
  attrs: {
    src: { default: '' },
    alt: { default: '' },
    title: { default: '' },
    width: { default: null },
    height: { default: null },
    align: { default: 'left' }, // "left", "center", "right"
  },
  group: 'block',
  draggable: true,
  toDOM(node) {
    const align = node.attrs.align || 'left'
    const width = node.attrs.width
    const height = node.attrs.height

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

    return [
      'div',
      {
        class: `pm-image-wrapper pm-image-align-${align}`,
        style: wrapperStyle,
      },
      [
        'img',
        {
          src: node.attrs.src,
          alt: node.attrs.alt,
          title: node.attrs.title,
          style,
          'data-width': width || '',
          'data-height': height || '',
          'data-align': align,
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
        return {
          src: img.getAttribute('src') || '',
          alt: img.getAttribute('alt') || '',
          title: img.getAttribute('title') || '',
          width:
            img.getAttribute('data-width') || img.getAttribute('width') || null,
          height:
            img.getAttribute('data-height') ||
            img.getAttribute('height') ||
            null,
          align: img.getAttribute('data-align') || 'left',
        }
      },
    },
    {
      tag: 'img[src]',
      getAttrs(dom) {
        if (typeof dom === 'string') return {}
        const element = dom as HTMLElement
        return {
          src: element.getAttribute('src') || '',
          alt: element.getAttribute('alt') || '',
          title: element.getAttribute('title') || '',
          width: element.getAttribute('width'),
          height: element.getAttribute('height'),
          align: element.getAttribute('data-align') || 'left',
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
    borderStyle: { default: 'solid' }, // "solid", "none"
    headerBackground: { default: '#f0f0f0' }, // color or "transparent"
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
 * Repeat table node - renders dynamic data from backend
 * columns: Array of { key: string, label: string }
 */
const repeatTableNode: NodeSpec = {
  group: 'block',
  atom: true,
  attrs: {
    sourceTable: { default: '' },
    columns: { default: [] }, // [{key: "column_name", label: "Türkçe Başlık"}]
    borderStyle: { default: 'solid' },
    headerBackground: { default: '#f0f0f0' },
  },
  toDOM(node) {
    const columns = node.attrs.columns as Array<{
      key: string
      label: string
      fontSize?: string
    }>
    const borderStyle = node.attrs.borderStyle || 'solid'
    const headerBg = node.attrs.headerBackground || '#f0f0f0'

    // Create placeholder table for editor preview
    const headerCells = columns.map((col) => {
      const fontSizeStyle = col.fontSize ? `font-size: ${col.fontSize};` : ''
      return [
        'th',
        {
          style:
            `background: ${headerBg}; padding: 8px; border: ${borderStyle === 'none' ? 'none' : '1px solid #ccc'}; ${fontSizeStyle}`.trim(),
        },
        col.label,
      ]
    })

    const placeholderCells = columns.map((col) => {
      const fontSizeStyle = col.fontSize ? `font-size: ${col.fontSize};` : ''
      return [
        'td',
        {
          style:
            `padding: 8px; border: ${borderStyle === 'none' ? 'none' : '1px solid #ccc'}; color: #888; ${fontSizeStyle}`.trim(),
        },
        `{{${node.attrs.sourceTable}.${col.key}}}`,
      ]
    })

    return [
      'div',
      {
        class: 'pm-repeat-table',
        'data-source-table': node.attrs.sourceTable,
        'data-columns': JSON.stringify(columns),
        'data-border-style': borderStyle,
        'data-header-bg': headerBg,
        style:
          'margin: 1em 0; border: 2px dashed #4caf50; padding: 4px; border-radius: 4px;',
      },
      [
        'div',
        { style: 'font-size: 11px; color: #4caf50; margin-bottom: 4px;' },
        ` Dinamik Tablo: ${node.attrs.sourceTable}`,
      ],
      [
        'table',
        { style: 'width: 100%; border-collapse: collapse;' },
        ['thead', ['tr', ...headerCells]],
        ['tbody', ['tr', ...placeholderCells]],
      ],
    ]
  },
  parseDOM: [
    {
      tag: 'div.pm-repeat-table',
      getAttrs(dom) {
        const el = dom as HTMLElement
        let columns: Array<{ key: string; label: string; fontSize?: string }> =
          []
        try {
          const columnsJson = el.getAttribute('data-columns') || '[]'
          columns = JSON.parse(columnsJson) as Array<{
            key: string
            label: string
            fontSize?: string
          }>

          // Extract font-size from header cells if not in JSON
          const table = el.querySelector('table')
          if (table) {
            const thead = table.querySelector('thead')
            if (thead) {
              const headerRow = thead.querySelector('tr')
              if (headerRow) {
                const headerCells = headerRow.querySelectorAll('th')
                headerCells.forEach((th, index) => {
                  if (columns[index]) {
                    // Check if font-size is in style attribute
                    const style = th.getAttribute('style') || ''
                    const fontSizeMatch = style.match(
                      /font-size\s*:\s*([^;]+)/i
                    )
                    if (
                      fontSizeMatch &&
                      fontSizeMatch[1] &&
                      !columns[index].fontSize
                    ) {
                      columns[index]!.fontSize = fontSizeMatch[1].trim()
                    }
                  }
                })
              }
            }
          }
        } catch {
          columns = []
        }
        return {
          sourceTable: el.getAttribute('data-source-table') || '',
          columns,
          borderStyle: el.getAttribute('data-border-style') || 'solid',
          headerBackground: el.getAttribute('data-header-bg') || '#f0f0f0',
        }
      },
    },
  ],
}

/**
 * Custom ProseMirror schema with page-based layout nodes
 */
export const pageLayoutSchema = new Schema({
  nodes: {
    ...basicNodes,
    doc: {
      ...basicNodes.doc,
      content: 'page+',
    },
    paragraph: paragraphWithAlign,
    page: pageNode,
    page_content: pageContentNode,
    page_break: pageBreakNode,
    placeholder: placeholderNode,
    image: imageNode,
    ordered_list: orderedList,
    bullet_list: bulletList,
    list_item: listItem,
    // Table nodes
    table: customTableNode,
    table_row: baseTableNodeSpecs.table_row,
    table_cell: baseTableNodeSpecs.table_cell,
    table_header: baseTableNodeSpecs.table_header,
    // Dynamic repeat table
    repeat_table: repeatTableNode,
  },
  marks: {
    ...basicMarks,
    font_size: fontSizeMark,
    text_color: textColorMark,
    highlight: highlightMark,
    line_height: lineHeightMark,
  },
})

export type PageLayoutSchema = typeof pageLayoutSchema
