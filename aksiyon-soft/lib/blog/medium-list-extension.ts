/**
 * Medium Editor: numaralandırma — pasifken menü yalnızca tıklama; liste içindeyken hover ile menü,
 * tıklanınca liste kaldırma; aktif düğme Medium activeButtonClass; panel body’de senkron float ile layout sıçraması azaltılır.
 */

import type MediumEditor from 'medium-editor'

type MediumEditorCtor = typeof MediumEditor

type NumberingLibraryClass = new () => unknown

const LIST_CLASS_PREFIX = 'blog-me-list-'

const HOVER_CLOSE_MS = 180

function stripBlogListClasses(el: Element): void {
  for (const c of [...el.classList]) {
    if (c.startsWith(LIST_CLASS_PREFIX)) {
      el.classList.remove(c)
    }
  }
}

function findContainingOl(
  root: HTMLElement | null,
  node: Node | null
): HTMLOListElement | null {
  if (!root || !node) return null
  const el =
    node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement
  const ol = el?.closest('ol')
  if (ol && root.contains(ol)) return ol as HTMLOListElement
  return null
}

function findContainingUl(
  root: HTMLElement | null,
  node: Node | null
): HTMLUListElement | null {
  if (!root || !node) return null
  const el =
    node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement
  const ul = el?.closest('ul')
  if (ul && root.contains(ul)) return ul as HTMLUListElement
  return null
}

/** Seçim odaklı editörde ol veya ul içinde mi? */
function selectionInList(focused: HTMLElement | null, doc: Document): boolean {
  if (!focused) return false
  const anchor = doc.getSelection()?.anchorNode ?? null
  return !!(
    findContainingOl(focused, anchor) ?? findContainingUl(focused, anchor)
  )
}

export type ListKind = 'decimal' | 'roman' | 'alpha' | 'bullet'

function applyListKind(
  focused: HTMLElement | null,
  doc: Document,
  kind: ListKind
): void {
  if (!focused) return
  const sel = doc.getSelection()
  const anchor = sel?.anchorNode ?? null

  if (kind === 'bullet') {
    const ul = findContainingUl(focused, anchor)
    if (ul) {
      stripBlogListClasses(ul)
      ul.classList.add('blog-me-list-large-bullet')
      ul.style.listStyleType = 'disc'
    }
    return
  }

  const ol = findContainingOl(focused, anchor)
  if (!ol) return
  stripBlogListClasses(ol)
  ol.style.removeProperty('list-style-type')

  if (kind === 'decimal') {
    ol.classList.add('blog-me-list-decimal')
    ol.style.listStyleType = 'decimal'
  } else if (kind === 'roman') {
    ol.classList.add('blog-me-list-roman')
    ol.style.listStyleType = 'lower-roman'
  } else {
    ol.classList.add('blog-me-list-alpha')
    ol.style.listStyleType = 'lower-alpha'
  }
}

type NumberingUiCtx = {
  base: {
    getFocusedElement: () => HTMLElement | null
    checkSelection: () => void
  }
  document: Document
  hideForm: () => void
  showToolbarDefaultActions: () => void
}

function scheduleApplyListKind(thisCtx: NumberingUiCtx, kind: ListKind): void {
  const run = () => {
    applyListKind(thisCtx.base.getFocusedElement(), thisCtx.document, kind)
    thisCtx.hideForm()
    thisCtx.showToolbarDefaultActions()
    thisCtx.base.checkSelection()
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(run)
  })
}

function finishNumberingUi(thisCtx: NumberingUiCtx): void {
  thisCtx.hideForm()
  thisCtx.showToolbarDefaultActions()
  thisCtx.base.checkSelection()
}

function removeListAtSelection(thisCtx: {
  base: {
    restoreSelection: () => void
    getFocusedElement: () => HTMLElement | null
  }
  document: Document
  execAction: (action: string) => void
}): void {
  thisCtx.base.restoreSelection()
  const focused = thisCtx.base.getFocusedElement()
  const anchor = thisCtx.document.getSelection()?.anchorNode ?? null
  const ol = findContainingOl(focused, anchor)
  if (ol) {
    stripBlogListClasses(ol)
    ol.style.removeProperty('list-style-type')
    thisCtx.execAction('insertorderedlist')
    return
  }
  const ul = findContainingUl(focused, anchor)
  if (ul) {
    stripBlogListClasses(ul)
    ul.style.removeProperty('list-style-type')
    thisCtx.execAction('insertunorderedlist')
  }
}

type ToolbarExtension = {
  getToolbarElement: () => HTMLElement
}

type NumberingExtensionThis = {
  window: Window
  document: Document
  form?: HTMLElement
  getButton: () => HTMLButtonElement
  getForm: () => HTMLElement
  isDisplayed: () => boolean
  showForm: () => void
  hideForm: () => void
  subscribe: (ev: string, fn: () => void) => void
  on: (
    el: Window | HTMLElement,
    ev: string,
    fn: (e: Event) => void,
    useCapture?: boolean
  ) => void
  off: (
    el: Window | HTMLElement,
    ev: string,
    fn: (e: Event) => void,
    useCapture?: boolean
  ) => void
  base: {
    getExtensionByName: (n: string) => ToolbarExtension | undefined
    unsubscribe: (ev: string, fn: () => void) => void
    getFocusedElement: () => HTMLElement | null
    checkSelection: () => void
  }
  _repositionNumberingPanel?: () => void
  _numberingHoverCloseTimer?: ReturnType<typeof globalThis.setTimeout>
  _onNumberingBtnEnter?: (e: Event) => void
  _onNumberingBtnLeave?: (e: Event) => void
  _onNumberingFormEnter?: (e: Event) => void
  _onNumberingFormLeave?: (e: Event) => void
  _onNumberingFormStopMouseUpBubble?: (e: Event) => void
  _onDocMouseDownCloseNumbering?: (e: Event) => void
  _cancelNumberingHoverClose: () => void
  _scheduleNumberingHoverClose: () => void
}

export function createBlogNumberingLibraryExtension(
  MediumEditorCtor: MediumEditorCtor
): NumberingLibraryClass {
  const Form = MediumEditorCtor.extensions.form

  return Form.extend({
    name: 'blogNumberingLibrary',
    aria: 'Numaralandırma kitaplığı',
    contentDefault:
      '<span class="blog-me-toolbar-num-icon" style="font-size:11px;line-height:1.15;font-weight:700;display:inline-block;text-align:left">1.<br/>2.</span>',

    isAlreadyApplied: function (
      this: NumberingExtensionThis,
      node: HTMLElement
    ) {
      const focused = this.base.getFocusedElement()
      if (!focused || !node) return false
      if (!focused.contains(node)) return false
      const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement
      if (!el) return false
      const ol = el.closest('ol')
      if (ol && focused.contains(ol)) return true
      const ul = el.closest('ul')
      return !!(ul && focused.contains(ul))
    },

    _cancelNumberingHoverClose: function (this: NumberingExtensionThis) {
      if (this._numberingHoverCloseTimer !== undefined) {
        clearTimeout(this._numberingHoverCloseTimer)
        delete this._numberingHoverCloseTimer
      }
    },

    _scheduleNumberingHoverClose: function (this: NumberingExtensionThis) {
      this._cancelNumberingHoverClose()
      this._numberingHoverCloseTimer = globalThis.setTimeout(() => {
        delete this._numberingHoverCloseTimer
        if (this.isDisplayed()) {
          this.hideForm()
          const base = this as unknown as {
            showToolbarDefaultActions: () => void
            base: { checkSelection: () => void }
          }
          base.showToolbarDefaultActions()
          base.base.checkSelection()
        }
      }, HOVER_CLOSE_MS)
    },

    init: function (this: NumberingExtensionThis) {
      MediumEditorCtor.extensions.form.prototype.init.apply(
        this,
        Array.from(arguments) as unknown[]
      )

      this._repositionNumberingPanel = () => {
        const self = this as unknown as {
          isDisplayed: () => boolean
          floatNumberingPanelToViewport: () => void
        }
        if (self.isDisplayed()) {
          self.floatNumberingPanelToViewport()
        }
      }
      this.subscribe('positionedToolbar', this._repositionNumberingPanel)
      this.on(this.window, 'scroll', this._repositionNumberingPanel, true)
      this.on(this.window, 'resize', this._repositionNumberingPanel)

      this._onNumberingBtnEnter = () => {
        this._cancelNumberingHoverClose()
        if (!selectionInList(this.base.getFocusedElement(), this.document)) {
          return
        }
        if (!this.isDisplayed()) {
          this.showForm()
        }
      }
      this._onNumberingBtnLeave = () => {
        this._scheduleNumberingHoverClose()
      }
      this.on(this.getButton(), 'mouseenter', this._onNumberingBtnEnter)
      this.on(this.getButton(), 'mouseleave', this._onNumberingBtnLeave)

      this._onDocMouseDownCloseNumbering = (e: Event) => {
        if (!this.isDisplayed()) return
        const t = e.target
        if (!(t instanceof Node)) return
        const form = this.getForm()
        if (form.contains(t)) return
        const btn = this.getButton()
        if (btn && (t === btn || btn.contains(t))) return
        this.hideForm()
        const self = this as unknown as {
          showToolbarDefaultActions: () => void
        }
        self.showToolbarDefaultActions()
        this.base.checkSelection()
      }
      this.on(
        this.document.documentElement,
        'mousedown',
        this._onDocMouseDownCloseNumbering,
        true
      )
    },

    destroy: function (this: NumberingExtensionThis) {
      this._cancelNumberingHoverClose()

      const fn = this._repositionNumberingPanel
      if (fn) {
        this.base.unsubscribe('positionedToolbar', fn)
        this.off(this.window, 'scroll', fn, true)
        this.off(this.window, 'resize', fn)
      }

      const btn = this.getButton()
      if (btn && this._onNumberingBtnEnter && this._onNumberingBtnLeave) {
        this.off(btn, 'mouseenter', this._onNumberingBtnEnter)
        this.off(btn, 'mouseleave', this._onNumberingBtnLeave)
      }

      const form = this.form
      if (form && this._onNumberingFormEnter && this._onNumberingFormLeave) {
        this.off(form, 'mouseenter', this._onNumberingFormEnter)
        this.off(form, 'mouseleave', this._onNumberingFormLeave)
      }
      if (form && this._onNumberingFormStopMouseUpBubble) {
        this.off(form, 'mouseup', this._onNumberingFormStopMouseUpBubble)
      }
      if (this._onDocMouseDownCloseNumbering) {
        this.off(
          this.document.documentElement,
          'mousedown',
          this._onDocMouseDownCloseNumbering,
          true
        )
      }

      const toolbar = this.base.getExtensionByName('toolbar')
      if (form && toolbar && form.parentNode === this.document.body) {
        toolbar.getToolbarElement().appendChild(form)
      }
    },

    getInteractionElements: function (this: { getForm: () => HTMLElement }) {
      return this.getForm()
    },

    floatNumberingPanelToViewport: function (this: {
      isDisplayed: () => boolean
      getForm: () => HTMLElement
      getButton: () => HTMLButtonElement
      document: Document
      window: Window
    }) {
      if (!this.isDisplayed()) return
      const form = this.getForm()
      const btn = this.getButton()
      const win = this.window
      const measuredWidth = form.offsetWidth || 200
      const rect = btn.getBoundingClientRect()
      const left = Math.min(
        Math.max(8, rect.left),
        win.innerWidth - measuredWidth - 8
      )
      const top = rect.bottom + 2
      form.style.position = 'fixed'
      form.style.left = `${String(left)}px`
      form.style.top = `${String(top)}px`
      form.style.zIndex = '2147483000'
      form.style.margin = '0'
      if (form.parentNode !== this.document.body) {
        this.document.body.appendChild(form)
      }
    },

    resetNumberingPanelDock: function (this: {
      base: { getExtensionByName: (n: string) => ToolbarExtension | undefined }
      document: Document
      getForm: () => HTMLElement
    }) {
      const form = this.getForm()
      const toolbar = this.base.getExtensionByName('toolbar')
      if (form && toolbar && form.parentNode === this.document.body) {
        toolbar.getToolbarElement().appendChild(form)
      }
      form.style.removeProperty('position')
      form.style.removeProperty('left')
      form.style.removeProperty('top')
      form.style.removeProperty('z-index')
      form.style.removeProperty('margin')
    },

    createButton: function (this: {
      getAction: () => string | undefined | null
    }) {
      const button =
        MediumEditorCtor.extensions.button.prototype.createButton.call(
          this
        ) as HTMLButtonElement
      if (!this.getAction()) {
        button.removeAttribute('data-action')
      }
      return button
    },

    getForm: function (this: {
      form?: HTMLDivElement
      createForm: () => HTMLDivElement
    }) {
      if (!this.form) {
        this.form = this.createForm()
      }
      return this.form
    },

    createForm: function (
      this: NumberingExtensionThis & {
        document: Document
        getEditorId: () => string
        on: (el: HTMLElement, ev: string, fn: (e: Event) => void) => void
        handleNumberingLibraryClick: (event: Event) => void
      }
    ) {
      const doc = this.document
      const form = doc.createElement('div')
      form.className =
        'medium-editor-toolbar-form blog-me-numbering-library blog-me-numbering-library--compact'
      form.id = `medium-editor-toolbar-form-numbering-${this.getEditorId()}`
      form.setAttribute('role', 'menu')
      form.setAttribute('aria-label', 'Numaralandırma kitaplığı')

      const sr = doc.createElement('div')
      sr.className = 'blog-me-numbering-library-sr'
      sr.textContent = 'Numaralandırma kitaplığı'
      form.appendChild(sr)

      const grid = doc.createElement('div')
      grid.className = 'blog-me-numbering-library-grid'

      const tiles: ReadonlyArray<{
        kind: ListKind
        label: string
        line: string
      }> = [
        { kind: 'decimal', label: 'Sayılı liste', line: '1. 2. 3.' },
        { kind: 'roman', label: 'Romen', line: 'i. ii. iii.' },
        { kind: 'alpha', label: 'Alfabetik', line: 'a. b. c.' },
        { kind: 'bullet', label: 'Madde işareti', line: '• Madde' },
      ]

      for (const tile of tiles) {
        const opt = doc.createElement('button')
        opt.type = 'button'
        opt.className = 'blog-me-numbering-tile medium-editor-button'
        opt.setAttribute('data-list-kind', tile.kind)
        opt.setAttribute('role', 'menuitem')
        opt.setAttribute('aria-label', `${tile.label}: ${tile.line}`)
        opt.title = tile.label
        opt.textContent = tile.line
        grid.appendChild(opt)
      }

      form.appendChild(grid)
      this.on(form, 'click', this.handleNumberingLibraryClick.bind(this))

      this._onNumberingFormStopMouseUpBubble = (e: Event) => {
        e.stopPropagation()
      }
      this.on(form, 'mouseup', this._onNumberingFormStopMouseUpBubble)

      this._onNumberingFormEnter = () => {
        this._cancelNumberingHoverClose()
      }
      this._onNumberingFormLeave = () => {
        this._scheduleNumberingHoverClose()
      }
      this.on(form, 'mouseenter', this._onNumberingFormEnter)
      this.on(form, 'mouseleave', this._onNumberingFormLeave)

      return form
    },

    handleNumberingLibraryClick: function (
      this: NumberingExtensionThis & {
        base: {
          restoreSelection: () => void
          getFocusedElement: () => HTMLElement | null
          checkSelection: () => void
        }
        execAction: (action: string) => void
        document: Document
        hideForm: () => void
        showToolbarDefaultActions: () => void
      },
      event: Event
    ) {
      event.stopPropagation()
      const t = event.target as HTMLElement | null
      const opt = t?.closest?.('[data-list-kind]') as HTMLButtonElement | null
      if (!opt) return
      const kind = opt.getAttribute('data-list-kind') as ListKind | null
      if (!kind) return
      event.preventDefault()
      ;(this as NumberingExtensionThis)._cancelNumberingHoverClose()

      this.base.restoreSelection()
      const focused = this.base.getFocusedElement()
      const anchor = this.document.getSelection()?.anchorNode ?? null

      const ui: NumberingUiCtx = {
        base: this.base,
        document: this.document,
        hideForm: this.hideForm.bind(this),
        showToolbarDefaultActions: (
          this as unknown as { showToolbarDefaultActions: () => void }
        ).showToolbarDefaultActions.bind(this),
      }

      if (kind === 'bullet') {
        const ul = findContainingUl(focused, anchor)
        if (ul) {
          applyListKind(focused, this.document, kind)
          finishNumberingUi(ui)
          return
        }
        const ol = findContainingOl(focused, anchor)
        if (ol) {
          this.execAction('insertunorderedlist')
          scheduleApplyListKind(ui, kind)
          return
        }
        this.execAction('insertunorderedlist')
        scheduleApplyListKind(ui, kind)
        return
      }

      const ol = findContainingOl(focused, anchor)
      if (ol) {
        applyListKind(focused, this.document, kind)
        finishNumberingUi(ui)
        return
      }

      const ul = findContainingUl(focused, anchor)
      if (ul) {
        this.execAction('insertorderedlist')
        scheduleApplyListKind(ui, kind)
        return
      }

      this.execAction('insertorderedlist')
      scheduleApplyListKind(ui, kind)
    },

    hideForm: function (this: unknown) {
      const self = this as unknown as {
        resetNumberingPanelDock: () => void
        _cancelNumberingHoverClose?: () => void
      }
      self._cancelNumberingHoverClose?.()
      self.resetNumberingPanelDock()
      MediumEditorCtor.extensions.form.prototype.hideForm.apply(this)
    },

    showForm: function (this: {
      base: { saveSelection: () => void }
      setToolbarPosition: () => void
      floatNumberingPanelToViewport: () => void
    }) {
      this.base.saveSelection()
      MediumEditorCtor.extensions.form.prototype.showForm.apply(this)
      this.floatNumberingPanelToViewport()
      this.setToolbarPosition()
      requestAnimationFrame(() => {
        this.floatNumberingPanelToViewport()
      })
    },

    handleClick: function (
      this: NumberingExtensionThis & {
        isDisplayed: () => boolean
        showForm: () => void
        base: {
          restoreSelection: () => void
          checkSelection: () => void
          getFocusedElement: () => HTMLElement | null
        }
        hideForm: () => void
        showToolbarDefaultActions: () => void
        execAction: (action: string) => void
        document: Document
      },
      event: Event
    ) {
      event.preventDefault()
      event.stopPropagation()
      this._cancelNumberingHoverClose()
      if (this.isDisplayed()) {
        this.base.restoreSelection()
        this.hideForm()
        this.showToolbarDefaultActions()
        this.base.checkSelection()
        return false
      }

      this.base.restoreSelection()
      if (selectionInList(this.base.getFocusedElement(), this.document)) {
        removeListAtSelection(this)
        this.showToolbarDefaultActions()
        this.base.checkSelection()
        return false
      }

      this.showForm()
      return false
    },
  })
}
