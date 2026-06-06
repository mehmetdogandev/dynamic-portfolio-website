import ExcelJS from 'exceljs'
import { z } from 'zod'
import type {
  ImportSchema,
  RowError,
  ExcelCellValue,
  ProcessedRow,
} from './types'
import { mapEnumToDb } from './core/enum-mapping'

// Re-export ProcessedRow for convenience
export type { ProcessedRow }

/**
 * Extract string/value from ExcelJS cell value.
 * Handles hyperlink objects ({ hyperlink, text }) and RichText to avoid [object Object].
 */
function extractCellValue(cellValue: unknown): ExcelCellValue {
  if (cellValue === null || cellValue === undefined) return null
  if (typeof cellValue !== 'object') return cellValue as ExcelCellValue
  // Formula result
  if ('result' in cellValue)
    return (cellValue as { result: unknown }).result as ExcelCellValue
  if (cellValue instanceof Date) return cellValue as ExcelCellValue
  // Hyperlink: prefer hyperlink (URL), fallback to text
  if ('hyperlink' in cellValue) {
    const hv = cellValue as {
      hyperlink?: string
      text?: string | { text: string }[]
    }
    if (hv.hyperlink) return hv.hyperlink as ExcelCellValue
    if (typeof hv.text === 'string') return hv.text as ExcelCellValue
    if (Array.isArray(hv.text))
      return hv.text.map((t) => t.text).join('') as ExcelCellValue
  }
  // RichText
  if ('richText' in cellValue) {
    const rv = cellValue as { richText: { text: string }[] }
    return rv.richText.map((t) => t.text).join('') as ExcelCellValue
  }
  return cellValue as ExcelCellValue
}

/**
 * Parse Excel file and extract data rows
 */
export async function parseExcelFile(
  buffer: Buffer,
  sheetName?: string
): Promise<ExcelCellValue[][]> {
  const workbook = new ExcelJS.Workbook()
  // ExcelJS accepts Buffer, ArrayBuffer, or Stream
  // Convert through unknown to handle Buffer type mismatch
  await workbook.xlsx.load(
    buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]
  )

  const worksheet = sheetName
    ? workbook.getWorksheet(sheetName)
    : workbook.worksheets[0]

  if (!worksheet) {
    throw new Error(
      `Sheet ${sheetName || workbook.worksheets[0]?.name || 'default'} not found`
    )
  }

  const rows: ExcelCellValue[][] = []

  // Read all rows
  worksheet.eachRow((row, _rowNumber) => {
    const rowValues: ExcelCellValue[] = []

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const value =
        cell.value !== null && cell.value !== undefined
          ? extractCellValue(cell.value)
          : null
      rowValues[colNumber - 1] = value // ExcelJS is 1-indexed, array is 0-indexed
    })

    rows.push(rowValues)
  })

  return rows
}

/**
 * Extract headers from first row
 */
export function extractHeaders(rows: ExcelCellValue[][]): string[] {
  if (rows.length === 0) {
    throw new Error('Excel file is empty')
  }

  const headers = rows[0] as string[]
  return headers.map((h) => (h ? String(h).trim() : ''))
}

/**
 * Extract data rows (skip header row)
 */
export function extractDataRows(rows: ExcelCellValue[][]): ExcelCellValue[][] {
  if (rows.length <= 1) {
    return []
  }

  return rows.slice(1)
}

/**
 * Convert Excel cell value to typed value
 */
export function convertCellValue(
  value: ExcelCellValue,
  columnType: string
): unknown {
  if (value === null || value === undefined || value === '') {
    return null
  }

  switch (columnType) {
    case 'number':
      if (typeof value === 'number') return value
      const num = Number(value)
      return isNaN(num) ? null : num
    case 'boolean':
      if (typeof value === 'boolean') return value
      if (typeof value === 'string') {
        const lower = value.toLowerCase()
        return lower === 'true' || lower === '1' || lower === 'evet'
      }
      return Boolean(value)
    case 'date':
      if (value instanceof Date) return value
      if (typeof value === 'number') {
        // Excel date serial number (days since 1900-01-01)
        // ExcelJS already converts dates to Date objects, but handle serial numbers if needed
        const excelEpoch = new Date(1899, 11, 30) // Excel epoch
        return new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000)
      }
      if (typeof value === 'string') {
        const date = new Date(value)
        return isNaN(date.getTime()) ? null : date
      }
      return null
    default:
      // Safeguard: object values (hyperlink, richText) that may have slipped through
      if (value !== null && typeof value === 'object') {
        if ('hyperlink' in value && (value as { hyperlink?: string }).hyperlink)
          return String((value as { hyperlink: string }).hyperlink)
        if ('text' in value) {
          const t = (
            value as {
              text?: string | { text: string }[]
            }
          ).text
          if (typeof t === 'string') return t
          if (Array.isArray(t)) return t.map((r) => r.text).join('')
        }
        if ('richText' in value)
          return (value as { richText: { text: string }[] }).richText
            .map((r) => r.text)
            .join('')
      }
      return String(value)
  }
}

/**
 * Map row data to object using column headers
 */
export function mapRowToObject(
  row: ExcelCellValue[],
  headers: string[],
  schema: ImportSchema
): Record<string, unknown> {
  const obj: Record<string, unknown> = {}

  for (let i = 0; i < headers.length && i < row.length; i++) {
    const header = headers[i]
    const value = row[i]

    // Find column definition
    const columnDef = schema.columns.find(
      (col) => col.name === header || col.displayName === header
    )

    if (columnDef) {
      let convertedValue = convertCellValue(value, columnDef.type)

      // Convert enum display values to database values BEFORE validation
      // This ensures Zod validation receives the correct enum values (e.g., "WHITE_COLLAR" instead of "Beyaz Yaka")
      if (
        columnDef.type === 'enum' &&
        columnDef.enumMapping &&
        convertedValue !== null &&
        convertedValue !== undefined &&
        convertedValue !== ''
      ) {
        const dbValue = mapEnumToDb(
          String(convertedValue),
          columnDef.enumMapping
        )
        if (dbValue) {
          convertedValue = dbValue
        }
        // If mapping fails, keep original value - validation will catch it with a better error message
      }

      obj[columnDef.name] = convertedValue
    }
  }

  return obj
}

/**
 * Validate row data against schema
 */
export function validateRow(
  rowData: Record<string, unknown>,
  rowNumber: number,
  schema: ImportSchema
): ProcessedRow {
  const errors: RowError[] = []

  // Check required fields
  for (const column of schema.columns) {
    if (column.required) {
      const value = rowData[column.name]
      if (
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      ) {
        errors.push({
          rowNumber,
          column: column.displayName,
          message: `${column.displayName} alanı zorunludur`,
        })
      }
    }
  }

  // Run custom validators
  for (const column of schema.columns) {
    if (column.validator) {
      const value = rowData[column.name]
      if (value !== null && value !== undefined && value !== '') {
        const error = column.validator(value)
        if (error) {
          errors.push({
            rowNumber,
            column: column.displayName,
            message: error,
          })
        }
      }
    }
  }

  // Validate with Zod schema if no errors so far
  if (errors.length === 0) {
    try {
      const validated = schema.baseSchema.parse(rowData)
      return {
        rowNumber,
        data: validated,
        errors: [],
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        for (const issue of error.issues) {
          const field = issue.path.join('.')
          const column = schema.columns.find((col) => col.name === field)
          errors.push({
            rowNumber,
            column: column?.displayName || field,
            message: issue.message,
          })
        }
      }
    }
  }

  return {
    rowNumber,
    data: rowData,
    errors,
  }
}

/**
 * Parse and validate Excel file
 */
export async function parseAndValidateExcel(
  buffer: Buffer,
  schema: ImportSchema,
  sheetName?: string
): Promise<ProcessedRow[]> {
  // Always read from "Veriler" sheet for personal import
  const rows = await parseExcelFile(buffer, sheetName || 'Veriler')
  const headers = extractHeaders(rows)
  const dataRows = extractDataRows(rows)

  const processed: ProcessedRow[] = []

  for (let i = 0; i < dataRows.length; i++) {
    const rowNumber = i + 2 // +2 because row 1 is header and Excel is 1-indexed
    const row = dataRows[i]

    // Skip completely empty rows
    if (
      row.every((cell) => cell === null || cell === undefined || cell === '')
    ) {
      continue
    }

    const rowData = mapRowToObject(row, headers, schema)
    const validated = validateRow(rowData, rowNumber, schema)

    processed.push(validated)
  }

  return processed
}
