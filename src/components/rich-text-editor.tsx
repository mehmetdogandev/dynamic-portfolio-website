"use client";

import { useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

const RESIZE_HANDLE_SIZE = 10;
const MIN_IMG_SIZE = 50;

function setupDoubleClickToolbar(
  editable: HTMLElement,
  _editor: import("medium-editor").MediumEditorInstance,
) {
  const handler = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.closest("img")) return;

    const sel = document.getSelection();
    if (!sel) return;

    editable.focus();

    const isEmpty =
      !editable.textContent?.trim() ||
      editable.innerHTML === "" ||
      editable.innerHTML === "<p><br></p>" ||
      editable.innerHTML === "<br>";
    if (isEmpty) {
      const range = document.createRange();
      range.selectNodeContents(editable);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      document.dispatchEvent(new Event("selectionchange"));
    }
  };

  editable.addEventListener("dblclick", handler);
  return () => editable.removeEventListener("dblclick", handler);
}

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
    } else if (handle === "e" || handle === "w") {
      w = handle === "e" ? Math.max(MIN_IMG_SIZE, e.clientX - rect.left) : Math.max(MIN_IMG_SIZE, rect.right - e.clientX);
      if (handle === "w") currentImg.style.marginLeft = `${rect.width - w}px`;
      else currentImg.style.marginLeft = "";
      currentImg.style.marginTop = "";
    } else if (handle === "n" || handle === "s") {
      h = handle === "s" ? Math.max(MIN_IMG_SIZE, e.clientY - rect.top) : Math.max(MIN_IMG_SIZE, rect.bottom - e.clientY);
      if (handle === "n") currentImg.style.marginTop = `${rect.height - h}px`;
      else currentImg.style.marginTop = "";
      currentImg.style.marginLeft = "";
    }
    currentImg.style.width = `${Math.round(w)}px`;
    currentImg.style.height = `${Math.round(h)}px`;
    overlay.style.width = `${w}px`;
    overlay.style.height = `${h}px`;
    if (handle !== "se" && handle !== "e" && handle !== "s") updateOverlayPosition(currentImg);
    if (handle === "w" || handle === "nw") {
      overlay.style.left = `${rect.left + (rect.width - w)}px`;
    }
    if (handle === "n" || handle === "nw" || handle === "ne") {
      overlay.style.top = `${rect.top + (rect.height - h)}px`;
    }
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
    const cornerDirs: ReadonlyArray<[string, string, string, string, string, string]> = [
      ["nw", "0", "0", "0", "0", "nwse-resize"],
      ["ne", "0", "0", "0", "auto", "nesw-resize"],
      ["sw", "0", "auto", "0", "0", "nesw-resize"],
      ["se", "0", "auto", "auto", "0", "nwse-resize"],
    ];
    const edgeDirs: ReadonlyArray<[string, Record<string, string>, string]> = [
      ["n", { top: "0", left: "50%", width: "24px", height: "6px", transform: "translate(-50%, -50%)" }, "n-resize"],
      ["e", { right: "0", top: "50%", width: "6px", height: "24px", transform: "translate(50%, -50%)" }, "e-resize"],
      ["s", { bottom: "0", left: "50%", width: "24px", height: "6px", transform: "translate(-50%, 50%)" }, "s-resize"],
      ["w", { left: "0", top: "50%", width: "6px", height: "24px", transform: "translate(-50%, -50%)" }, "w-resize"],
    ];
    cornerDirs.forEach(([dir, top, right, bottom, left, cursor]) => {
      const handleEl = document.createElement("div");
      handleEl.style.cssText = `position:absolute;top:${top};right:${right};bottom:${bottom};left:${left};width:${RESIZE_HANDLE_SIZE}px;height:${RESIZE_HANDLE_SIZE}px;background:var(--ring,#6366f1);cursor:${cursor};pointer-events:auto;border-radius:2px`;
      handleEl.addEventListener("mousedown", (e) => onHandleMouseDown(e, dir));
      overlayEl.appendChild(handleEl);
    });
    edgeDirs.forEach(([dir, style, cursor]) => {
      const handleEl = document.createElement("div");
      Object.assign(handleEl.style, { position: "absolute", background: "var(--ring, #6366f1)", cursor, pointerEvents: "auto", borderRadius: "2px" }, style);
      handleEl.addEventListener("mousedown", (e) => onHandleMouseDown(e, dir));
      overlayEl.appendChild(handleEl);
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
    onChangeRef.current(html ?? "");
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === "undefined") return;

    const initEditor = async () => {
      const MediumEditor = (await import("medium-editor")).default;

      const alignButton = (name: string, action: string, label: string, content: string) =>
        MediumEditor.extensions.button.extend({
          name,
          action,
          aria: label,
          contentDefault: content,
        });

      const AlignLeftExtension = alignButton("alignLeft", "justifyLeft", "Sola yasla", '<span title="Sola yasla">≡</span>');
      const AlignCenterExtension = alignButton("alignCenter", "justifyCenter", "Ortala", '<span title="Ortala">≡</span>');
      const AlignRightExtension = alignButton("alignRight", "justifyRight", "Sağa yasla", '<span title="Sağa yasla">≡</span>');
      const JustifyExtension = alignButton("justify", "justifyFull", "İki yana yasla", '<span title="İki yana yasla">≡</span>');

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
                  const img = ext.document.createElement("img");
                  img.src = url;
                  img.alt = "";
                  img.style.cssText =
                    "float: left; margin-right: 1rem; margin-bottom: 0.5rem; max-width: 100%;";
                  const sel = ext.document.getSelection();
                  const range = sel?.rangeCount ? sel.getRangeAt(0) : null;
                  if (range) {
                    range.collapse(true);
                    range.insertNode(img);
                    range.setStartAfter(img);
                    range.setEndAfter(img);
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                    const base = ext.base as unknown as { elements?: HTMLElement[] };
                    const editable = base.elements?.[0];
                    if (editable) editable.dispatchEvent(new InputEvent("input", { bubbles: true }));
                  } else {
                    ext.document.execCommand("insertImage", false, url);
                  }
                  try {
                    (ext.base as unknown as { checkSelection?: () => void }).checkSelection?.();
                  } catch {
                    // ignore
                  }
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

      const extensions: Record<string, unknown> = {
        alignLeft: new AlignLeftExtension(),
        alignCenter: new AlignCenterExtension(),
        alignRight: new AlignRightExtension(),
        justify: new JustifyExtension(),
      };

      if (ImageUploadExtension && onImageUpload) {
        extensions.imageUpload = new ImageUploadExtension({ onImageUpload });
      }

      const buttons = [
        "bold",
        "italic",
        "underline",
        "anchor",
        "alignLeft",
        "alignCenter",
        "alignRight",
        "justify",
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
        extensions,
        targetBlank: false,
        spellcheck: true,
      });

      editorRef.current = editor;
      editor.setContent(value || "", 0);
      editor.subscribe("editableInput", handleContentChange);

      const cleanupImageResize = setupImageResize(container, handleContentChange);
      const cleanupDblclick = setupDoubleClickToolbar(container, editor);

      return () => {
        cleanupImageResize();
        cleanupDblclick();
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
    <div className={cn(className, "w-full")}>
      <div className={cn("min-h-[400px] w-full rounded-md border border-input bg-background overflow-auto ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2", disabled && "cursor-not-allowed opacity-50")}>
        <div
          ref={containerRef}
          className="min-h-[400px] max-w-[65ch] mx-auto px-3 py-2 text-sm prose prose-sm dark:prose-invert [&_img]:float-left [&_img]:mr-4 [&_img]:mb-2 [&_img]:max-w-full"
        />
      </div>
    </div>
  );
}
