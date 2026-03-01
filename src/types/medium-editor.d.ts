declare module "medium-editor" {
  interface MediumEditorOptions {
    placeholder?: { text?: string; hideOnClick?: boolean };
    toolbar?: { buttons?: string[]; diffTop?: number; updateOnEmptySelection?: boolean };
    extensions?: Record<string, unknown>;
    targetBlank?: boolean;
    spellcheck?: boolean;
  }

  export interface MediumEditorInstance {
    getContent(index?: number): string;
    setContent(html: string, index?: number): void;
    destroy(): void;
    subscribe(event: string, handler: () => void): void;
    elements?: HTMLElement[];
  }

  const MediumEditor: {
    new (elements: HTMLElement | HTMLElement[] | string, options?: MediumEditorOptions): MediumEditorInstance;
    extensions: {
      button: {
        extend: (props: Record<string, unknown>) => new (opts?: Record<string, unknown>) => unknown;
      };
    };
  };

  export default MediumEditor;
}
