import type { ImportSchema } from './types'
import ExcelJS from 'exceljs'
if (typeof window === 'undefined' && process.env.NEXT_RUNTIME) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('server-only')
}

function getColumnLetter(columnNumber: number): string {
  let result = ''
  let n = columnNumber
  while (n > 0) {
    const remainder = (n - 1) % 26
    result = String.fromCharCode(65 + remainder) + result
    n = Math.floor((n - 1) / 26)
  }
  return result
}

function createInstructionSheet(
  worksheet: ExcelJS.Worksheet,
  text: string
): void {
  const lines = text.split('\n')
  lines.forEach((line, i) => {
    worksheet.getCell(`A${i + 1}`).value = line
  })
  worksheet.getColumn(1).width = 100
}

/**
 * Data sheet: headers, column widths, basic list validation for boolean/enum columns.
 */
function createDataSheet(
  worksheet: ExcelJS.Worksheet,
  schema: ImportSchema
): void {
  const headers = schema.columns.map((col) => col.displayName)
  const headerRow = worksheet.addRow(headers)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  }

  for (let i = 0; i < schema.columns.length; i++) {
    const column = schema.columns[i]
    const columnNumber = i + 1
    const columnLetter = getColumnLetter(columnNumber)
    const col = worksheet.getColumn(columnNumber)
    col.width = Math.max(column.displayName.length + 2, 15)

    if (column.type === 'boolean') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(worksheet as any).dataValidations.add(
        `${columnLetter}2:${columnLetter}1000`,
        {
          type: 'list',
          allowBlank: !column.required,
          formulae: ['"Evet,Hayır"'],
          showErrorMessage: true,
          errorTitle: 'Geçersiz Değer',
          error: 'Sadece "Evet" veya "Hayır" seçebilirsiniz',
          errorStyle: 'stop',
          showInputMessage: false,
        }
      )
    }

    if (column.type === 'enum' && column.enumMapping?.length) {
      const enumValues = column.enumMapping.map((m) => m.displayValue)
      const escapedValues = enumValues.map((v) => v.replace(/"/g, '""'))
      const formula = `"${escapedValues.join(',')}"`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(worksheet as any).dataValidations.add(
        `${columnLetter}2:${columnLetter}1000`,
        {
          type: 'list',
          allowBlank: !column.required,
          formulae: [formula],
          showErrorMessage: false,
        }
      )
    }
  }
}

/**
 * Generate an import template workbook from a declarative {@link ImportSchema}.
 */
export async function generateExcelTemplate(
  schema: ImportSchema,
  instructionSheet?: string,
  dataSheetName = 'Veriler'
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const dataSheet = workbook.addWorksheet(dataSheetName)
  createDataSheet(dataSheet, schema)

  if (instructionSheet) {
    const inst = workbook.addWorksheet('Kullanım Talimatları')
    createInstructionSheet(inst, instructionSheet)
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
