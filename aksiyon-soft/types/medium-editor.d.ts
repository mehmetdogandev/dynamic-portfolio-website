declare module 'medium-editor' {
  export interface MediumEditorToolbarOptions {
    buttons?: string[]
    diffTop?: number
    diffLeft?: number
    standardizeSelectionStart?: boolean
    allowMultiParagraphSelection?: boolean
  }

  export interface MediumEditorPlaceholderOptions {
    text?: string
  }

  export interface MediumEditorExtensionConstructor {
    new (options?: unknown): unknown
  }

  export interface MediumEditorOptions {
    disableEditing?: boolean
    elementsContainer?: HTMLElement | false
    toolbar?: MediumEditorToolbarOptions
    placeholder?: MediumEditorPlaceholderOptions
    targetBlank?: boolean
    /** Custom toolbar / behavior extensions (e.g. heading picker). */
    extensions?: Record<string, MediumEditorExtensionConstructor | unknown>
  }

  export default class MediumEditor {
    static extensions: {
      form: {
        extend: (proto: object) => new () => unknown
        prototype: {
          init: (this: unknown, ...args: unknown[]) => void
          hideForm: (this: unknown) => void
          showForm: (this: unknown) => void
        }
      }
      button: {
        extend: (proto: object) => new () => unknown
        prototype: { createButton: (this: unknown) => HTMLButtonElement }
      }
    }

    constructor(
      elements: HTMLElement | HTMLElement[],
      options?: MediumEditorOptions
    )
    destroy(): void
    getContent(index?: number): string | null
    setContent(html: string, index?: number): void
    subscribe(
      event: string,
      listener: (eventData: unknown, editable: HTMLElement) => void
    ): void
    pasteHTML(html: string, options?: unknown): void
  }
}
