"use client";

import { useEffect, useRef, useCallback } from "react";

const RESIZE_HANDLE_SIZE = 10;
const MIN_IMG_SIZE = 50;

function setupImageResize(
  editable: HTMLElement,
  onContentChange: () => void,
) {
  let overlay: HTMLDivElement | null = null;
  let currentImg: HTMLImageElement | null = null;
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;

  function hideOverlay() {
    if (overlay?.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
    currentImg = null;
  }

  function updateOverlayPosition(img: HTMLImageElement) {
    if (!overlay) return;
    const rect = img.getBoundingClientRect();
    overlay.style.left = `${rect.left}px`;
    overlay.style.top = `${rect.top}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
  }

  function onMouseMove(e: MouseEvent) {
    if (!currentImg || !overlay) return;
    const rect = overlay.getBoundingClientRect();
    const handle = (overlay as unknown as { _resizeDir?: string })._resizeDir;
    let w = rect.width;
    let h = rect.height;
    if (handle === "se") {
      w = Math.max(MIN_IMG_SIZE, e.clientX - rect.left);
      h = Math.max(MIN_IMG_SIZE, e.clientY - rect.top);
      currentImg.style.marginLeft = "";
      currentImg.style.marginTop = "";
    } else if (handle === "sw") {
      w = Math.max(MIN_IMG_SIZE, rect.right - e.clientX);
      h = Math.max(MIN_IMG_SIZE, e.clientY - rect.top);
      currentImg.style.marginLeft = `${rect.width - w}px`;
      currentImg.style.marginTop = "";
    } else if (handle === "ne") {
      w = Math.max(MIN_IMG_SIZE, e.clientX - rect.left);
      h = Math.max(MIN_IMG_SIZE, rect.bottom - e.clientY);
      currentImg.style.marginLeft = "";
      currentImg.style.marginTop = `${rect.height - h}px`;
    } else if (handle === "nw") {
      w = Math.max(MIN_IMG_SIZE, rect.right - e.clientX);
      h = Math.max(MIN_IMG_SIZE, rect.bottom - e.clientY);
      currentImg.style.marginLeft = `${rect.width - w}px`;
      currentImg.style.marginTop = `${rect.height - h}px`;
    }
    currentImg.style.width = `${Math.round(w)}px`;
    currentImg.style.height = `${Math.round(h)}px`;
    overlay.style.width = `${w}px`;
    overlay.style.height = `${h}px`;
    if (handle !== "se") updateOverlayPosition(currentImg);
  }

  function onMouseUp() {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    if (currentImg) onContentChange();
    hideOverlay();
  }

  function onHandleMouseDown(e: MouseEvent, dir: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!overlay || !currentImg) return;
    (overlay as unknown as { _resizeDir?: string })._resizeDir = dir;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = overlay.offsetWidth;
    startHeight = overlay.offsetHeight;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  function showResizeOverlay(img: HTMLImageElement) {
    hideOverlay();
    currentImg = img;
    const rect = img.getBoundingClientRect();
    const overlayEl = document.createElement("div");
    overlay = overlayEl;
    overlayEl.className = "medium-editor-image-resize-overlay";
    overlayEl.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border: 2px solid var(--ring, #6366f1);
      box-sizing: border-box;
      z-index: 9999;
      pointer-events: none;
    `;
    const dirs = [
      ["nw", "0", "0", "0", "0"],
      ["ne", "0", "0", "0", "auto"],
      ["sw", "0", "auto", "0", "0"],
      ["se", "0", "auto", "auto", "0"],
    ] as const;
    dirs.forEach(([dir, top, right, bottom, left]) => {
      const h = document.createElement("div");
      h.className = `medium-editor-resize-handle medium-editor-resize-handle-${dir}`;
      h.style.cssText = `
        position: absolute;
        top: ${top};
        right: ${right};
        bottom: ${bottom};
        left: ${left};
        width: ${RESIZE_HANDLE_SIZE}px;
        height: ${RESIZE_HANDLE_SIZE}px;
        background: var(--ring, #6366f1);
        cursor: ${dir === "nw" || dir === "se" ? "nwse-resize" : "nesw-resize"};
        pointer-events: auto;
        border-radius: 2px;
      `;
      h.addEventListener("mousedown", (e) => onHandleMouseDown(e, dir));
      overlayEl.appendChild(h);
    });
    document.body.appendChild(overlayEl);
  }

  const scrollHandler = () => {
    if (overlay && currentImg) updateOverlayPosition(currentImg);
  };
  window.addEventListener("scroll", scrollHandler, true);

  const clickHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    const img = target.closest("img");
    if (img && editable.contains(img)) {
      e.preventDefault();
      e.stopPropagation();
      showResizeOverlay(img);
    } else {
      hideOverlay();
    }
  };
  editable.addEventListener("click", clickHandler);

  return () => {
    hideOverlay();
    window.removeEventListener("scroll", scrollHandler, true);
    editable.removeEventListener("click", clickHandler);
  };
}

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Upload image file and return the URL to use (e.g. /api/files/{id}/view) */
  onImageUpload?: (file: File) => Promise<string>;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "İçerik yazın...",
  disabled = false,
  className,
  onImageUpload,
}: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<import("medium-editor").MediumEditorInstance | null>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const handleContentChange = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.getContent(0);
    if (html !== undefined) {
      onChangeRef.current(html);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === "undefined") return;

    const initEditor = async () => {
      const MediumEditor = (await import("medium-editor")).default;

      const ImageUploadExtension = onImageUpload
        ? MediumEditor.extensions.button.extend({
            name: "imageUpload",
            action: "",
            aria: "Görsel ekle",
            contentDefault: '<b title="Görsel ekle">🖼</b>',
            handleClick: function (event: Event) {
              event.preventDefault();
              event.stopPropagation();
              const ext = this as unknown as {
                base: { saveSelection: () => void; restoreSelection: () => void; checkSelection: () => void };
                document: Document;
                onImageUpload?: (f: File) => Promise<string>;
              };
              const uploadFn = ext.onImageUpload;
              if (!uploadFn) return false;

              ext.base.saveSelection();

              const input = ext.document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.style.display = "none";

              input.onchange = async (ev: Event) => {
                const target = ev.target as HTMLInputElement;
                const file = target.files?.[0];
                target.value = "";
                if (!file?.type.startsWith("image/")) return;
                try {
                  const url = await uploadFn(file);
                  ext.base.restoreSelection();
                  ext.document.execCommand("insertImage", false, url);
                  ext.base.checkSelection();
                } catch {
                  // ignore
                }
              };

              ext.document.body.appendChild(input);
              input.click();
              ext.document.body.removeChild(input);
              return false;
            },
          })
        : null;

      const extensions: Record<string, unknown> = {};

      if (ImageUploadExtension && onImageUpload) {
        extensions.imageUpload = new ImageUploadExtension({ onImageUpload });
      }

      const buttons = [
        "bold",
        "italic",
        "underline",
        "anchor",
        "h1",
        "h2",
        "h3",
        "quote",
        "pre",
        "orderedlist",
        "unorderedlist",
      ];
      if (onImageUpload) {
        buttons.push("imageUpload");
      }

      const editor = new MediumEditor(container, {
        placeholder: { text: placeholder, hideOnClick: true },
        toolbar: {
          buttons,
          diffTop: -10,
          updateOnEmptySelection: true,
        },
        extensions: Object.keys(extensions).length > 0 ? extensions : undefined,
        targetBlank: false,
        spellcheck: true,
      });

      editorRef.current = editor;
      editor.setContent(value || "", 0);
      editor.subscribe("editableInput", handleContentChange);

      const cleanupImageResize = setupImageResize(container, handleContentChange);

      return () => {
        cleanupImageResize();
        editor.destroy();
        editorRef.current = null;
      };
    };

    let destroy: (() => void) | undefined;
    let cancelled = false;
    void initEditor().then((d) => {
      if (!cancelled) destroy = d;
    });
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [placeholder, onImageUpload, handleContentChange]);

  useEffect(() => {
    if (!editorRef.current || !containerRef.current) return;
    const currentContent = editorRef.current.getContent(0);
    const normalizedValue = value || "";
    if (currentContent !== normalizedValue) {
      editorRef.current.setContent(normalizedValue, 0);
    }
  }, [value]);

  useEffect(() => {
    if (!editorRef.current || !containerRef.current) return;
    const el = editorRef.current.elements?.[0];
    if (el) {
      el.contentEditable = disabled ? "false" : "true";
    }
  }, [disabled]);

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="min-h-[400px] h-[400px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 prose prose-sm dark:prose-invert max-w-none overflow-auto"
      />
    </div>
  );
}
