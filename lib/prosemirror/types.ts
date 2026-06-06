/**
 * Type definitions for ProseMirror document JSON structure
 */

export interface ProseMirrorNodeJSON {
  type: string
  attrs?: Record<string, unknown>
  content?: ProseMirrorNodeJSON[]
  marks?: Array<{
    type: string
    attrs?: Record<string, unknown>
  }>
  text?: string
}

export interface ProseMirrorDocJSON {
  type: 'doc'
  content: ProseMirrorNodeJSON[]
}
