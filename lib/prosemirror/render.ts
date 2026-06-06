import { Node, Schema } from 'prosemirror-model'
import { DOMSerializer } from 'prosemirror-model'

/**
 * Get a document object for server-side rendering
 */
function getDocument(): Document {
  if (typeof document !== 'undefined') {
    // Client-side: use browser's document
    return document
  } else {
    // Server-side: use JSDOM
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { JSDOM } = require('jsdom')
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
    return dom.window.document
  }
}

/**
 * Convert ProseMirror document to HTML (server-side compatible)
 */
export function pmDocToHTML(doc: Node, schema: Schema): string {
  const document = getDocument()
  const serializer = DOMSerializer.fromSchema(schema)

  // Serialize the document content directly - don't filter nodes
  // Filtering will be done on HTML level if needed
  const fragment = serializer.serializeFragment(doc.content, { document })

  // Convert fragment to HTML string directly without any wrapper
  // This is critical to avoid extra blank pages in PDF
  const tempContainer = document.createElement('div')
  tempContainer.appendChild(fragment)

  // Get only the innerHTML - no wrapper div in final output
  let html = ''
  for (let i = 0; i < tempContainer.childNodes.length; i++) {
    const node = tempContainer.childNodes[i]
    if (node.nodeType === 1) {
      // Element node
      html += (node as HTMLElement).outerHTML
    }
  }

  // Aggressively remove any whitespace that could cause blank pages
  html = html.trim()
  // Remove any leading/trailing newlines or spaces
  html = html.replace(/^[\s\n\r]+|[\s\n\r]+$/g, '')

  return html
}

/**
 * Resolve nested path in an object (e.g., "order.personal.name")
 */
function resolveNestedPath(
  obj: Record<string, unknown>,
  path: string
): unknown {
  return path.split('.').reduce((current, key) => {
    if (current == null || typeof current !== 'object') return null
    return (current as Record<string, unknown>)[key]
  }, obj as unknown)
}

/**
 * Format values for placeholder rendering
 * - If value is a Date or ISO-like string, render as DD.MM.YYYY
 * - Otherwise return stringified value
 */
function formatPlaceholderValue(value: unknown): string {
  // If it's already a Date
  if (value instanceof Date) {
    const yyyy = value.getFullYear()
    const mm = String(value.getMonth() + 1).padStart(2, '0')
    const dd = String(value.getDate()).padStart(2, '0')
    return `${dd}.${mm}.${yyyy}`
  }

  if (typeof value === 'string') {
    // ISO date or datetime with T
    const isoMatch =
      /^(\d{4})-(\d{2})-(\d{2})(?:[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)?$/.exec(
        value
      )
    if (isoMatch) {
      const [, yyyy, mm, dd] = isoMatch
      return `${dd}.${mm}.${yyyy}`
    }
  }

  if (value == null) return ''

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return ''
    }
  }

  return String(value)
}

/**
 * Replace placeholder patterns in HTML with context values
 * Supports nested paths: {{ table.column }} or {{ table.relation.column }}
 * Also removes the placeholder span wrapper and its styles
 */
export function fillPlaceholders(
  html: string,
  context: Record<string, unknown>
): string {
  // Provide built-in date/time placeholders to allow templates like {{today}} or {{date.iso}}
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')

  const defaultContext: Record<string, unknown> = {
    today: `${dd}.${mm}.${yyyy}`, // DD.MM.YYYY
    currentDate: `${yyyy}-${mm}-${dd}`,
    currentTime: `${hh}:${min}:${ss}`,
    currentDateTime: `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`,
    date: {
      iso: now.toISOString(),
      ymd: `${yyyy}-${mm}-${dd}`,
      time: `${hh}:${min}:${ss}`,
      year: yyyy,
      month: mm,
      day: dd,
    },
  }

  // Merge provided context with defaults (user context overrides defaults if same keys)
  const mergedContext = { ...defaultContext, ...context }

  // First, remove placeholder span wrappers and replace their content
  // Match <span class="pm-placeholder">{{ ... }}</span> patterns
  let result = html.replace(
    /<span\s+class=["']pm-placeholder["'][^>]*>\s*\{\{\s*([^}]+)\s*\}\}\s*<\/span>/gi,
    (match, key) => {
      const trimmedKey = key.trim()
      const value = resolveNestedPath(mergedContext, trimmedKey)

      // Handle different value types
      if (value == null || value === undefined) {
        return '' // Empty string for missing values
      }

      return formatPlaceholderValue(value)
    }
  )

  // Also handle any remaining {{ ... }} patterns that might not be in spans
  result = result.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, key) => {
    const trimmedKey = key.trim()
    const value = resolveNestedPath(mergedContext, trimmedKey)

    // Handle different value types
    if (value == null || value === undefined) {
      return '' // Empty string for missing values
    }

    return formatPlaceholderValue(value)
  })

  return result
}

/**
 * Extract font size from page node
 * Searches backwards from the repeat table position to find the nearest .pm-page node
 */
function extractPageFontSize(html: string, repeatTableIndex: number): string {
  // Find all .pm-page nodes before this repeat table
  // Search backwards from the repeat table position
  const searchStart = Math.max(0, repeatTableIndex - 50000) // Search up to 50000 chars back
  const searchHtml = html.slice(searchStart, repeatTableIndex)

  // Find all .pm-page divs in the search area
  // Use a more robust regex that handles various attribute orders
  const pageMatches = [
    // Pattern 1: class="pm-page" ... data-font-size="..."
    ...searchHtml.matchAll(
      /<div[^>]*class\s*=\s*["']?[^"']*pm-page[^"']*["']?[^>]*data-font-size\s*=\s*["']([^"']+)["'][^>]*>/gi
    ),
    // Pattern 2: data-font-size="..." ... class="pm-page"
    ...searchHtml.matchAll(
      /<div[^>]*data-font-size\s*=\s*["']([^"']+)["'][^>]*class\s*=\s*["']?[^"']*pm-page[^"']*["']?[^>]*>/gi
    ),
  ]

  // Get the last match (nearest to repeat table)
  if (pageMatches.length > 0) {
    const lastMatch = pageMatches[pageMatches.length - 1]
    if (lastMatch && lastMatch[1]) {
      const fontSize = lastMatch[1].trim()
      if (fontSize && fontSize !== '') {
        return fontSize
      }
    }
  }

  // Try to get from style attribute
  const styleMatches = [
    // Pattern 1: class="pm-page" ... style="...font-size:..."
    ...searchHtml.matchAll(
      /<div[^>]*class\s*=\s*["']?[^"']*pm-page[^"']*["']?[^>]*style\s*=\s*["']([^"']+)["'][^>]*>/gi
    ),
    // Pattern 2: style="...font-size:..." ... class="pm-page"
    ...searchHtml.matchAll(
      /<div[^>]*style\s*=\s*["']([^"']+)["'][^>]*class\s*=\s*["']?[^"']*pm-page[^"']*["']?[^>]*>/gi
    ),
  ]

  // Get the last match and extract font-size
  if (styleMatches.length > 0) {
    const lastStyleMatch = styleMatches[styleMatches.length - 1]
    if (lastStyleMatch && lastStyleMatch[1]) {
      const style = lastStyleMatch[1]
      const fontSizeMatch = style.match(/font-size\s*:\s*([^;]+)/i)
      if (fontSizeMatch && fontSizeMatch[1]) {
        const fontSize = fontSizeMatch[1].trim()
        if (fontSize && fontSize !== '') {
          return fontSize
        }
      }
    }
  }

  // Default font size from body
  return '12pt'
}

/**
 * Extract line height from page node
 * Searches backwards from the repeat table position to find the nearest .pm-page node
 */
function extractPageLineHeight(
  html: string,
  repeatTableIndex: number
): string | null {
  // Find all .pm-page nodes before this repeat table
  // Search backwards from the repeat table position
  const searchStart = Math.max(0, repeatTableIndex - 50000) // Search up to 50000 chars back
  const searchHtml = html.slice(searchStart, repeatTableIndex)

  // Find all .pm-page divs in the search area
  // Use a more robust regex that handles various attribute orders
  const pageMatches = [
    // Pattern 1: class="pm-page" ... data-line-height="..."
    ...searchHtml.matchAll(
      /<div[^>]*class\s*=\s*["']?[^"']*pm-page[^"']*["']?[^>]*data-line-height\s*=\s*["']([^"']+)["'][^>]*>/gi
    ),
    // Pattern 2: data-line-height="..." ... class="pm-page"
    ...searchHtml.matchAll(
      /<div[^>]*data-line-height\s*=\s*["']([^"']+)["'][^>]*class\s*=\s*["']?[^"']*pm-page[^"']*["']?[^>]*>/gi
    ),
  ]

  // Get the last match (nearest to repeat table)
  if (pageMatches.length > 0) {
    const lastMatch = pageMatches[pageMatches.length - 1]
    if (lastMatch && lastMatch[1]) {
      const lineHeight = lastMatch[1].trim()
      if (lineHeight && lineHeight !== '') {
        return lineHeight
      }
    }
  }

  // Try to get from style attribute
  const styleMatches = [
    // Pattern 1: class="pm-page" ... style="...line-height:..."
    ...searchHtml.matchAll(
      /<div[^>]*class\s*=\s*["']?[^"']*pm-page[^"']*["']?[^>]*style\s*=\s*["']([^"']+)["'][^>]*>/gi
    ),
    // Pattern 2: style="...line-height:..." ... class="pm-page"
    ...searchHtml.matchAll(
      /<div[^>]*style\s*=\s*["']([^"']+)["'][^>]*class\s*=\s*["']?[^"']*pm-page[^"']*["']?[^>]*>/gi
    ),
  ]

  // Get the last match and extract line-height
  if (styleMatches.length > 0) {
    const lastStyleMatch = styleMatches[styleMatches.length - 1]
    if (lastStyleMatch && lastStyleMatch[1]) {
      const style = lastStyleMatch[1]
      const lineHeightMatch = style.match(/line-height\s*:\s*([^;]+)/i)
      if (lineHeightMatch && lineHeightMatch[1]) {
        const lineHeight = lineHeightMatch[1].trim()
        if (lineHeight && lineHeight !== '') {
          return lineHeight
        }
      }
    }
  }

  // Return null if not found - CSS inherit will be used
  return null
}

/**
 * Extract font-size values from header cells in a repeat table HTML
 * Returns an array of font-size values, one per column (or null if not found)
 * Also extracts font-size from paragraph elements inside th cells
 */
function extractColumnFontSizes(repeatTableHtml: string): Array<string | null> {
  const fontSizes: Array<string | null> = []

  try {
    // Use JSDOM or browser DOM to parse the HTML
    const document = getDocument()
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = repeatTableHtml

    // Find the table inside the repeat-table div
    const table = tempDiv.querySelector('table')
    if (!table) {
      return []
    }

    // Find all header cells in thead > tr > th
    const thead = table.querySelector('thead')
    if (!thead) {
      return []
    }

    const headerRow = thead.querySelector('tr')
    if (!headerRow) {
      return []
    }

    const headerCells = headerRow.querySelectorAll('th')

    for (const th of Array.from(headerCells)) {
      let fontSize: string | null = null

      // First, check if the th element itself has font-size in its style
      const thStyle = th.getAttribute('style') || ''
      const thFontSizeMatch = thStyle.match(/font-size\s*:\s*([^;]+)/i)
      if (thFontSizeMatch && thFontSizeMatch[1]) {
        fontSize = thFontSizeMatch[1].trim()
      } else {
        // Check for font-size in nested paragraph elements (ProseMirror uses <p> in table cells)
        const paragraphs = th.querySelectorAll('p')
        for (const p of Array.from(paragraphs)) {
          const pStyle = p.getAttribute('style') || ''
          const pFontSizeMatch = pStyle.match(/font-size\s*:\s*([^;]+)/i)
          if (pFontSizeMatch && pFontSizeMatch[1]) {
            fontSize = pFontSizeMatch[1].trim()
            break
          }

          // Check for font-size in spans inside paragraph
          const spansWithFontSize = p.querySelectorAll(
            'span[style*="font-size"]'
          )
          if (spansWithFontSize.length > 0) {
            // Get the first span with font-size (closest to the text)
            const firstSpan = spansWithFontSize[0] as HTMLElement
            const spanStyle = firstSpan.getAttribute('style') || ''
            const spanFontSizeMatch = spanStyle.match(
              /font-size\s*:\s*([^;]+)/i
            )
            if (spanFontSizeMatch && spanFontSizeMatch[1]) {
              fontSize = spanFontSizeMatch[1].trim()
              break
            }
          }
        }

        // If still not found, check for font-size in any span elements directly in th
        if (!fontSize) {
          const spansWithFontSize = th.querySelectorAll(
            'span[style*="font-size"]'
          )
          if (spansWithFontSize.length > 0) {
            // Get the first span with font-size (closest to the text)
            const firstSpan = spansWithFontSize[0] as HTMLElement
            const spanStyle = firstSpan.getAttribute('style') || ''
            const spanFontSizeMatch = spanStyle.match(
              /font-size\s*:\s*([^;]+)/i
            )
            if (spanFontSizeMatch && spanFontSizeMatch[1]) {
              fontSize = spanFontSizeMatch[1].trim()
            }
          }
        }
      }

      fontSizes.push(fontSize)
    }
  } catch (error) {
    // If parsing fails, return empty array (will fall back to page font size)
    console.warn('Failed to extract column font sizes:', error)
    return []
  }

  return fontSizes
}

/**
 * Expand repeat_table divs in HTML with actual data rows
 */
function expandRepeatTables(
  html: string,
  repeatTableData: Record<string, Array<Record<string, unknown>>>
): string {
  // Find all pm-repeat-table divs and replace them
  // We need to handle nested divs properly
  let result = html

  // Match opening tag with all attributes
  const openTagRegex =
    /<div\s+class="pm-repeat-table"[^>]*data-source-table="([^"]*)"[^>]*data-columns="([^"]*)"[^>]*data-border-style="([^"]*)"[^>]*data-header-bg="([^"]*)"[^>]*>/gi

  let match
  const replacements: Array<{
    start: number
    end: number
    replacement: string
  }> = []

  while ((match = openTagRegex.exec(html)) !== null) {
    const startIndex = match.index
    const sourceTable = match[1]
    const columnsJson = match[2]
    const borderStyle = match[3]
    const headerBg = match[4]

    // Extract font size and line height from page node
    const pageFontSize = extractPageFontSize(html, startIndex)
    const pageLineHeight = extractPageLineHeight(html, startIndex)
    const lineHeightStyle = pageLineHeight
      ? `line-height: ${pageLineHeight};`
      : ''

    // Find the matching closing div by counting nesting
    let depth = 1
    let searchIndex = startIndex + match[0].length

    while (depth > 0 && searchIndex < html.length) {
      const nextOpen = html.indexOf('<div', searchIndex)
      const nextClose = html.indexOf('</div>', searchIndex)

      if (nextClose === -1) break

      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++
        searchIndex = nextOpen + 4
      } else {
        depth--
        searchIndex = nextClose + 6
      }
    }

    if (depth === 0) {
      const endIndex = searchIndex

      try {
        const columns = JSON.parse(
          columnsJson.replace(/&quot;/g, '"')
        ) as Array<{ key: string; label: string; fontSize?: string }>
        const records = repeatTableData[sourceTable] || []

        // Extract font-sizes from columns attribute (preferred) or from HTML
        let columnFontSizes: Array<string | null> = columns.map(
          (col) => col.fontSize || null
        )

        // If no font-sizes in columns, try to extract from HTML
        if (columnFontSizes.every((fs) => fs === null)) {
          const repeatTableHtml = html.slice(startIndex, endIndex)
          const htmlFontSizes = extractColumnFontSizes(repeatTableHtml)
          // Use HTML font-sizes if found
          columnFontSizes = columnFontSizes.map((fs, i) => {
            const htmlFontSize = htmlFontSizes[i]
            return htmlFontSize !== null && htmlFontSize !== undefined
              ? htmlFontSize
              : fs
          })
        }

        let tableHtml: string

        if (records.length === 0) {
          tableHtml = `<div style="color: #999; font-style: italic; padding: 8px;">Dinamik tablo: ${sourceTable} - Kayıt bulunamadı</div>`
        } else {
          const borderCss = borderStyle === 'none' ? 'none' : '1px solid #ccc'

          // Ensure page break support is explicitly set
          // Apply font size and line height from page node to dynamic table
          // Make sure font-size and line-height are properly formatted
          const defaultFontSizeStyle =
            pageFontSize && pageFontSize.trim() !== ''
              ? `font-size: ${pageFontSize.trim()};`
              : 'font-size: 12pt;' // Fallback to default
          const finalLineHeightStyle = lineHeightStyle || ''

          // Combine styles with proper spacing
          const tableStyle =
            `width: 100%; border-collapse: collapse; margin: 1em 0; page-break-inside: auto; break-inside: auto; ${defaultFontSizeStyle} ${finalLineHeightStyle}`.trim()

          tableHtml = `<table class="pm-dynamic-table" style="${tableStyle}">`
          tableHtml += `<thead><tr>`
          for (let i = 0; i < columns.length; i++) {
            const col = columns[i]
            // Use column-specific font-size if available, otherwise use page font size
            const columnFontSize =
              columnFontSizes[i] && columnFontSizes[i]!.trim() !== ''
                ? columnFontSizes[i]!.trim()
                : pageFontSize && pageFontSize.trim() !== ''
                  ? pageFontSize.trim()
                  : '12pt'
            const headerFontSizeStyle = `font-size: ${columnFontSize};`
            const headerStyle =
              `background: ${headerBg}; padding: 8px; border: ${borderCss}; text-align: left; ${headerFontSizeStyle} ${finalLineHeightStyle}`.trim()
            tableHtml += `<th style="${headerStyle}">${col.label}</th>`
          }
          tableHtml += `</tr></thead>`
          tableHtml += `<tbody>`
          for (const record of records) {
            tableHtml += `<tr>`
            for (let i = 0; i < columns.length; i++) {
              const col = columns[i]
              const value = record[col.key]
              const displayValue = formatValueForTable(value)

              // Use the same font-size as the corresponding header cell
              const columnFontSize =
                columnFontSizes[i] && columnFontSizes[i]!.trim() !== ''
                  ? columnFontSizes[i]!.trim()
                  : pageFontSize && pageFontSize.trim() !== ''
                    ? pageFontSize.trim()
                    : '12pt'
              const cellFontSizeStyle = `font-size: ${columnFontSize};`
              const cellStyle =
                `padding: 8px; border: ${borderCss}; ${cellFontSizeStyle} ${finalLineHeightStyle}`.trim()
              tableHtml += `<td style="${cellStyle}">${displayValue}</td>`
            }
            tableHtml += `</tr>`
          }
          tableHtml += `</tbody></table>`
        }

        replacements.push({
          start: startIndex,
          end: endIndex,
          replacement: tableHtml,
        })
      } catch {
        // Skip this one if parsing fails
      }
    }
  }

  // Apply replacements from end to start to maintain correct indices
  for (let i = replacements.length - 1; i >= 0; i--) {
    const { start, end, replacement } = replacements[i]
    result = result.slice(0, start) + replacement + result.slice(end)
  }

  return result
}

/**
 * Format a value for display in table cell
 */
function formatValueForTable(value: unknown): string {
  if (value == null) return ''

  if (value instanceof Date) {
    const dd = String(value.getDate()).padStart(2, '0')
    const mm = String(value.getMonth() + 1).padStart(2, '0')
    const yyyy = value.getFullYear()
    return `${dd}.${mm}.${yyyy}`
  }

  if (typeof value === 'string') {
    // Check if ISO date
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s]|$)/.exec(value)
    if (isoMatch) {
      const [, yyyy, mm, dd] = isoMatch
      return `${dd}.${mm}.${yyyy}`
    }
    return value
  }

  if (typeof value === 'boolean') {
    return value ? 'Evet' : 'Hayır'
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return ''
    }
  }

  return String(value)
}

/**
 * Convert ProseMirror document to HTML and fill placeholders
 */
export function renderTemplate(
  doc: Node,
  schema: Schema,
  context: Record<string, unknown>,
  repeatTableData?: Record<string, Array<Record<string, unknown>>>
): string {
  let html = pmDocToHTML(doc, schema)

  // Expand repeat tables first
  if (repeatTableData && Object.keys(repeatTableData).length > 0) {
    html = expandRepeatTables(html, repeatTableData)
  }

  // Then fill placeholders
  return fillPlaceholders(html, context)
}
