import { Command, TextSelection } from 'prosemirror-state'
import { Node } from 'prosemirror-model'

/**
 * Insert a page break node at the current selection
 */
export function insertPageBreak(): Command {
  return (state, dispatch) => {
    const { schema } = state
    const pageBreak = schema.nodes.page_break?.create()

    if (!pageBreak) {
      return false
    }

    if (dispatch) {
      dispatch(state.tr.replaceSelectionWith(pageBreak))
    }

    return true
  }
}

/**
 * Insert a new page node after the current page
 */
export function insertNewPage(): Command {
  return (state, dispatch) => {
    const { schema, selection } = state
    const { $from } = selection

    // Find the current page node
    let pageNode = null
    let pagePos = -1

    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth)
      if (node.type.name === 'page') {
        pageNode = node
        pagePos = $from.before(depth)
        break
      }
    }

    if (!pageNode || pagePos === -1) {
      return false
    }

    // Calculate the position after the current page
    const pageEnd = pagePos + pageNode.nodeSize

    // Create a new page with same margins and font family
    const newPage = schema.nodes.page.create(
      {
        marginTop: pageNode.attrs.marginTop || '20mm',
        marginBottom: pageNode.attrs.marginBottom || '20mm',
        marginLeft: pageNode.attrs.marginLeft || '20mm',
        marginRight: pageNode.attrs.marginRight || '20mm',
        size: pageNode.attrs.size || 'A4',
        orientation: pageNode.attrs.orientation || 'portrait',
        fontFamily: pageNode.attrs.fontFamily || 'Arial, sans-serif',
        fontSize: pageNode.attrs.fontSize || '12pt',
        lineHeight: pageNode.attrs.lineHeight || null,
      },
      [schema.nodes.page_content.create({}, [schema.nodes.paragraph.create()])]
    )

    if (dispatch) {
      const tr = state.tr.insert(pageEnd, newPage)
      // Move cursor to the new page's content area
      const newPageContentPos = pageEnd + 1 // At content start
      const resolvedPos = tr.doc.resolve(newPageContentPos)
      tr.setSelection(TextSelection.near(resolvedPos))
      dispatch(tr)
    }

    return true
  }
}

/**
 * Insert a placeholder (merge field) node at the current selection
 * @param key - The merge field key (e.g., "personal.name" or "order.personal.name")
 */
export function insertPlaceholder(key: string): Command {
  return (state, dispatch) => {
    const { schema } = state
    const placeholderNodeType = schema.nodes.placeholder

    if (!placeholderNodeType) {
      return false
    }

    const placeholder = placeholderNodeType.create({ key })

    if (!placeholder) {
      return false
    }

    if (dispatch) {
      const tr = state.tr

      // Always use replaceSelectionWith for inline atom nodes
      const replaced = tr.replaceSelectionWith(placeholder)

      if (!replaced) {
        return false
      }

      // Place cursor immediately after the placeholder (same line, not new line)
      // Use the position right after the inserted placeholder
      const newPos = tr.selection.$from.pos
      tr.setSelection(TextSelection.create(tr.doc, newPos))

      dispatch(tr)
    }

    return true
  }
}

/**
 * Update page margins for the current page node
 * @param margins - Object with marginTop, marginBottom, marginLeft, marginRight
 */
export function setPageMargins(margins: {
  marginTop?: string
  marginBottom?: string
  marginLeft?: string
  marginRight?: string
}): Command {
  return (state, dispatch) => {
    const { selection } = state
    const { $from } = selection

    // Find the page node containing the current selection
    let pageNode = null
    let pagePos = -1

    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth)
      if (node.type.name === 'page') {
        pageNode = node
        pagePos = $from.before(depth)
        break
      }
    }

    if (!pageNode || pagePos === -1) {
      return false
    }

    if (dispatch) {
      const attrs = {
        ...pageNode.attrs,
        ...margins,
      }

      dispatch(state.tr.setNodeMarkup(pagePos, undefined, attrs))
    }

    return true
  }
}

/**
 * Set page orientation for the current page node
 * @param orientation - "portrait" or "landscape"
 */
export function setPageOrientation(
  orientation: 'portrait' | 'landscape'
): Command {
  return (state, dispatch) => {
    const { selection } = state
    const { $from } = selection

    // Find the page node containing the current selection
    let pageNode = null
    let pagePos = -1

    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth)
      if (node.type.name === 'page') {
        pageNode = node
        pagePos = $from.before(depth)
        break
      }
    }

    if (!pageNode || pagePos === -1) {
      return false
    }

    if (dispatch) {
      const attrs = {
        ...pageNode.attrs,
        orientation,
      }

      dispatch(state.tr.setNodeMarkup(pagePos, undefined, attrs))
    }

    return true
  }
}

/**
 * Set page font family for the current page node
 * @param fontFamily - Font family string (e.g., "Arial, sans-serif")
 */
export function setPageFontFamily(fontFamily: string): Command {
  return (state, dispatch) => {
    const { selection } = state
    const { $from } = selection

    // Find the page node containing the current selection
    let pageNode = null
    let pagePos = -1

    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth)
      if (node.type.name === 'page') {
        pageNode = node
        pagePos = $from.before(depth)
        break
      }
    }

    if (!pageNode || pagePos === -1) {
      return false
    }

    if (dispatch) {
      const attrs = {
        ...pageNode.attrs,
        fontFamily,
      }

      dispatch(state.tr.setNodeMarkup(pagePos, undefined, attrs))
    }

    return true
  }
}

/**
 * Set page line height for the current page node
 * @param lineHeight - Line height string (e.g., "1.4", "1.5", "24px")
 */
export function setPageLineHeight(lineHeight: string | null): Command {
  return (state, dispatch) => {
    const { selection } = state
    const { $from } = selection

    // Find the page node containing the current selection
    let pageNode = null
    let pagePos = -1

    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth)
      if (node.type.name === 'page') {
        pageNode = node
        pagePos = $from.before(depth)
        break
      }
    }

    if (!pageNode || pagePos === -1) {
      return false
    }

    if (dispatch) {
      const attrs = {
        ...pageNode.attrs,
        lineHeight: lineHeight || null,
      }

      dispatch(state.tr.setNodeMarkup(pagePos, undefined, attrs))
    }

    return true
  }
}

/**
 * Set text alignment for selected paragraph(s)
 */
export function setTextAlign(
  align: 'left' | 'center' | 'right' | 'justify' | null
): Command {
  return (state, dispatch) => {
    const { selection } = state
    const { $from, $to } = selection

    const tr = state.tr
    let modified = false

    state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
      if (node.type.name === 'paragraph') {
        const currentAlign =
          (node.attrs as { align?: string | null })?.align || null
        if (currentAlign !== align) {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            align: align || null,
          })
          modified = true
        }
      }
    })

    if (modified && dispatch) {
      dispatch(tr)
    }

    return modified
  }
}

/**
 * Set font size for selected text
 */
export function setFontSize(size: string | null): Command {
  return (state, dispatch) => {
    const { selection, schema } = state
    const { $from, $to } = selection
    const markType = schema.marks.font_size

    if (!markType) {
      return false
    }

    const tr = state.tr
    if (size) {
      tr.addMark($from.pos, $to.pos, markType.create({ size }))
    } else {
      tr.removeMark($from.pos, $to.pos, markType)
    }

    if (dispatch) {
      dispatch(tr)
    }

    return true
  }
}

/**
 * Set line height for selected text
 */
export function setLineHeight(height: string | null): Command {
  return (state, dispatch) => {
    const { selection, schema } = state
    const { $from, $to } = selection
    const markType = schema.marks.line_height

    if (!markType) {
      return false
    }

    const tr = state.tr
    if (height) {
      tr.addMark($from.pos, $to.pos, markType.create({ height }))
    } else {
      tr.removeMark($from.pos, $to.pos, markType)
    }

    if (dispatch) {
      dispatch(tr)
    }

    return true
  }
}

/**
 * Set text color for selected text
 */
export function setTextColor(color: string | null): Command {
  return (state, dispatch) => {
    const { selection, schema } = state
    const { $from, $to } = selection
    const markType = schema.marks.text_color

    if (!markType) {
      return false
    }

    const tr = state.tr
    if (color) {
      tr.addMark($from.pos, $to.pos, markType.create({ color }))
    } else {
      tr.removeMark($from.pos, $to.pos, markType)
    }

    if (dispatch) {
      dispatch(tr)
    }

    return true
  }
}

/**
 * Set highlight / background color for selected text
 */
export function setHighlightColor(color: string | null): Command {
  return (state, dispatch) => {
    const { selection, schema } = state
    const { $from, $to } = selection
    const markType = schema.marks.highlight

    if (!markType) {
      return false
    }

    const tr = state.tr
    if (color) {
      tr.addMark($from.pos, $to.pos, markType.create({ color }))
    } else {
      tr.removeMark($from.pos, $to.pos, markType)
    }

    if (dispatch) {
      dispatch(tr)
    }

    return true
  }
}

/**
 * Insert an image at the current selection
 */
export function insertImage(
  src: string,
  alt?: string,
  title?: string,
  width?: string,
  height?: string,
  align?: 'left' | 'center' | 'right'
): Command {
  return (state, dispatch) => {
    const { schema } = state
    const image = schema.nodes.image?.create({
      src,
      alt: alt || '',
      title: title || '',
      width: width || null,
      height: height || null,
      align: align || 'left',
    })

    if (!image) {
      return false
    }

    if (dispatch) {
      dispatch(state.tr.replaceSelectionWith(image))
    }

    return true
  }
}

/**
 * Update alignment of selected image
 */
export function setImageAlign(align: 'left' | 'center' | 'right'): Command {
  return (state, dispatch) => {
    const { selection } = state
    const { $from } = selection

    // Check if selection is an image node
    const node = $from.node()
    if (node && node.type.name === 'image') {
      if (dispatch) {
        const attrs = { ...node.attrs, align }
        const tr = state.tr.setNodeMarkup(
          $from.before($from.depth),
          undefined,
          attrs
        )
        dispatch(tr)
      }
      return true
    }

    // Check if parent is image wrapper
    const parent = $from.parent
    if (parent && parent.type.name === 'image') {
      if (dispatch) {
        const attrs = { ...parent.attrs, align }
        const tr = state.tr.setNodeMarkup(
          $from.before($from.depth - 1),
          undefined,
          attrs
        )
        dispatch(tr)
      }
      return true
    }

    // Try to find image node in selection
    let imagePos: number | null = null
    let foundImageAttrs: Record<string, unknown> | null = null

    state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
      if (node.type.name === 'image' && !foundImageAttrs) {
        foundImageAttrs = node.attrs as Record<string, unknown>
        imagePos = pos
      }
    })

    if (foundImageAttrs && imagePos !== null) {
      if (dispatch) {
        const attrs: Record<string, unknown> = Object.assign(
          {},
          foundImageAttrs,
          { align }
        )
        const tr = state.tr.setNodeMarkup(imagePos, undefined, attrs)
        dispatch(tr)
      }
      return true
    }

    return false
  }
}

/**
 * Update size of selected image
 */
export function setImageSize(
  width: string | null,
  height: string | null
): Command {
  return (state, dispatch) => {
    const { selection } = state
    const { $from } = selection

    // Check if selection is an image node
    const node = $from.node()
    if (node && node.type.name === 'image') {
      if (dispatch) {
        const attrs = { ...node.attrs, width, height }
        const tr = state.tr.setNodeMarkup(
          $from.before($from.depth),
          undefined,
          attrs
        )
        dispatch(tr)
      }
      return true
    }

    // Check if parent is image wrapper
    const parent = $from.parent
    if (parent && parent.type.name === 'image') {
      if (dispatch) {
        const attrs = { ...parent.attrs, width, height }
        const tr = state.tr.setNodeMarkup(
          $from.before($from.depth - 1),
          undefined,
          attrs
        )
        dispatch(tr)
      }
      return true
    }

    // Try to find image node in selection
    let imagePos: number | null = null
    let foundImageAttrs: Record<string, unknown> | null = null

    state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
      if (node.type.name === 'image' && !foundImageAttrs) {
        foundImageAttrs = node.attrs as Record<string, unknown>
        imagePos = pos
      }
    })

    if (foundImageAttrs && imagePos !== null) {
      if (dispatch) {
        const baseAttrs = foundImageAttrs as Record<string, unknown>
        const attrs: Record<string, unknown> = {
          ...baseAttrs,
          width,
          height,
        }
        const tr = state.tr.setNodeMarkup(imagePos, undefined, attrs)
        dispatch(tr)
      }
      return true
    }

    return false
  }
}

/**
 * Table style options
 */
export interface TableStyleOptions {
  borderStyle?: 'solid' | 'none'
  headerBackground?: string // color or "transparent"
}

/**
 * Insert a table at the current selection
 * @param rows - Number of rows (default: 3)
 * @param cols - Number of columns (default: 3)
 * @param withHeaderRow - Whether to include a header row (default: true)
 * @param styles - Style options for the table
 */
export function insertTable(
  rows: number = 3,
  cols: number = 3,
  withHeaderRow: boolean = true,
  styles: TableStyleOptions = {}
): Command {
  return (state, dispatch) => {
    const { schema } = state
    const tableNode = schema.nodes.table
    const tableRowNode = schema.nodes.table_row
    const tableCellNode = schema.nodes.table_cell
    const tableHeaderNode = schema.nodes.table_header
    const paragraphNode = schema.nodes.paragraph

    if (!tableNode || !tableRowNode || !tableCellNode || !paragraphNode) {
      return false
    }

    // Create cells
    const createCell = (isHeader: boolean) => {
      const cellType =
        isHeader && tableHeaderNode ? tableHeaderNode : tableCellNode
      return cellType.create({}, [paragraphNode.create()])
    }

    // Create rows
    const tableRows = []
    for (let i = 0; i < rows; i++) {
      const isHeaderRow = withHeaderRow && i === 0
      const cells = []
      for (let j = 0; j < cols; j++) {
        cells.push(createCell(isHeaderRow))
      }
      tableRows.push(tableRowNode.create({}, cells))
    }

    // Create table with style attributes
    const table = tableNode.create(
      {
        borderStyle: styles.borderStyle || 'solid',
        headerBackground: styles.headerBackground || '#f0f0f0',
      },
      tableRows
    )

    if (dispatch) {
      dispatch(state.tr.replaceSelectionWith(table))
    }

    return true
  }
}

/**
 * Column configuration for repeat table
 */
export interface RepeatTableColumn {
  key: string
  label: string
  fontSize?: string // Optional font size for the column header and data cells
}

/**
 * Insert a repeat (dynamic) table at the current selection
 */
export function insertRepeatTable(
  sourceTable: string,
  columns: RepeatTableColumn[],
  styles: TableStyleOptions = {}
): Command {
  return (state, dispatch) => {
    const { schema } = state
    const repeatTableNode = schema.nodes.repeat_table

    if (!repeatTableNode) {
      return false
    }

    const node = repeatTableNode.create({
      sourceTable,
      columns,
      borderStyle: styles.borderStyle || 'solid',
      headerBackground: styles.headerBackground || '#f0f0f0',
    })

    if (dispatch) {
      dispatch(state.tr.replaceSelectionWith(node))
    }

    return true
  }
}

/**
 * Update font size for a specific column in a repeat table
 * The selection must be inside or on a repeat_table node
 */
export function updateRepeatTableColumnFontSize(
  columnIndex: number,
  fontSize: string | null
): Command {
  return (state, dispatch) => {
    const { selection, schema } = state
    const repeatTableNode = schema.nodes.repeat_table

    if (!repeatTableNode) {
      return false
    }

    // Find the repeat_table node
    let repeatTablePos: number | null = null
    let repeatTableNodeInstance: Node | null = null

    state.doc.descendants((node, pos) => {
      if (node.type === repeatTableNode) {
        // Check if selection is inside this node
        if (
          selection.$from.pos >= pos &&
          selection.$from.pos <= pos + node.nodeSize
        ) {
          repeatTablePos = pos
          repeatTableNodeInstance = node as Node
          return false // Stop searching
        }
      }
    })

    if (!repeatTableNodeInstance || repeatTablePos === null) {
      return false
    }

    // Type assertion to ensure TypeScript knows this is a Node
    const node = repeatTableNodeInstance as Node

    // Update the column's fontSize
    const attrs = node.attrs as {
      sourceTable: string
      columns: RepeatTableColumn[]
      borderStyle: string
      headerBackground: string
    }
    const columns = [...attrs.columns]

    if (columnIndex >= 0 && columnIndex < columns.length) {
      if (fontSize) {
        columns[columnIndex] = {
          ...columns[columnIndex],
          fontSize,
        }
      } else {
        // Remove fontSize if null
        const { fontSize: _, ...rest } = columns[columnIndex]
        columns[columnIndex] = rest
      }

      const updatedNode = repeatTableNode.create({
        ...attrs,
        columns,
      })

      if (dispatch) {
        const tr = state.tr.replaceWith(
          repeatTablePos,
          repeatTablePos + node.nodeSize,
          updatedNode
        )
        dispatch(tr)
      }

      return true
    }

    return false
  }
}
