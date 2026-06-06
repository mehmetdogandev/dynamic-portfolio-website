import { z } from 'zod'

/**
 * Status of a processed row during import
 */
export type RowStatus = 'success' | 'failed' | 'skipped'

/**
 * Error details for a failed row
 */
export interface RowError {
  rowNumber: number
  column?: string
  message: string
}

/**
 * Result of processing a single row
 */
export interface RowResult<T = unknown> {
  rowNumber: number
  status: RowStatus
  data?: T
  error?: RowError
}

/**
 * Column type definitions for import schema
 */
export type ColumnType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'enum'
  | 'relation'

/**
 * Enum mapping configuration
 */
export interface EnumMapping {
  displayValue: string
  dbValue: string
}

/**
 * Relation resolver configuration
 */
export interface RelationResolver {
  type: 'lookup' | 'create'
  table: string
  lookupField: string
  displayField: string
  createFields?: string[]
  dependentOn?: string // For dependent dropdowns (e.g., location depends on organization)
}

/**
 * Column definition for import schema
 */
export interface ColumnDefinition<T extends z.ZodType = z.ZodType> {
  name: string
  displayName: string
  type: ColumnType
  required: boolean
  zodSchema: T
  enumMapping?: EnumMapping[]
  relationResolver?: RelationResolver
  description?: string
  validator?: (value: unknown) => string | null
}

/**
 * Import schema definition
 */
export interface ImportSchema<T extends z.ZodType = z.ZodType> {
  columns: ColumnDefinition[]
  baseSchema: T
  relationResolvers?: Map<string, RelationResolver>
}

/**
 * Import result summary
 */
export interface ImportResult<T = unknown> {
  totalRows: number
  successCount: number
  skippedCount: number
  failedCount: number
  results: RowResult<T>[]
}

/**
 * Validated row data ready for processing
 */
export interface ProcessedRow<T = unknown> {
  rowNumber: number
  data: T
  errors: RowError[]
}

/**
 * Excel cell value type
 */
export type ExcelCellValue = string | number | boolean | Date | null | undefined
