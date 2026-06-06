import ExcelJS from 'exceljs'
if (typeof window === 'undefined' && process.env.NEXT_RUNTIME) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('server-only')
}

export type ExportColumn = {
  /** Excel header */
  header: string
  /** Key on each row object */
  key: string
}

/**
 * Generic export: one worksheet, headers from `columns`, one row per record.
 * Cell values are stringified via `formatCell` default (empty → '').
 */
export async function exportRecordsToExcel(options: {
  sheetName?: string
  columns: ExportColumn[]
  rows: Record<string, unknown>[]
  workbookCreator?: string
}): Promise<Buffer> {
  const {
    sheetName = 'Veriler',
    columns,
    rows,
    workbookCreator = 'Export',
  } = options

  const workbook = new ExcelJS.Workbook()
  workbook.creator = workbookCreator
  workbook.created = new Date()
  const worksheet = workbook.addWorksheet(sheetName)

  worksheet.addRow(columns.map((c) => c.header))
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  }

  for (const row of rows) {
    worksheet.addRow(
      columns.map((c) => {
        const v = row[c.key]
        if (v === null || v === undefined) return ''
        if (v instanceof Date) return v.toISOString().split('T')[0]
        if (typeof v === 'object') return JSON.stringify(v)
        return String(v)
      })
    )
  }

  columns.forEach((c, i) => {
    worksheet.getColumn(i + 1).width = Math.max(c.header.length + 2, 14)
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
