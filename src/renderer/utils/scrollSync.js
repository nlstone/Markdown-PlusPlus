/**
 * Scroll Sync Manager
 *
 * Implements bidirectional scroll synchronization between CodeMirror editor
 * and HTML preview pane, using VS Code's line-based mapping approach.
 *
 * Key concepts:
 * - Map editor lines to preview elements via data-line attributes
 * - Find visible line in editor, scroll preview to corresponding element
 * - Find visible element in preview, scroll editor to corresponding line
 */

/**
 * Throttle function to limit execution frequency
 */
function throttle (fn, delay = 50) {
  let lastCall = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      fn.apply(this, args)
    }
  }
}

class ScrollSyncManager {
  /**
   * Create scroll sync manager
   *
   * @param {CodeMirror} editor - CodeMirror editor instance
   * @param {HTMLElement} previewContainer - Preview pane scrollable container
   * @param {HTMLElement} previewContent - Preview content element
   */
  constructor (editor, previewContainer, previewContent) {
    this.editor = editor
    this.previewContainer = previewContainer
    this.previewContent = previewContent

    // Scroll sync state
    this.scrollDisabledCount = 0
    this.scrollDisabledTimer = null
    this.lastEditorLine = -1
    this.lastPreviewLine = -1

    // Cache for line elements
    this.lineElementsCache = null
    this.cacheGeneration = -1

    // Bind scroll handlers with throttle
    this.handleEditorScroll = throttle(this.syncFromEditor.bind(this), 50)
    this.handlePreviewScroll = throttle(this.syncFromPreview.bind(this), 50)

    // Set up listeners
    this.setupListeners()
  }

  /**
   * Get or refresh line elements cache
   */
  getLineElements () {
    const generation = this.editor.changeGeneration()
    if (this.cacheGeneration !== generation) {
      this.lineElementsCache = this.previewContent.querySelectorAll('[data-line]')
      this.cacheGeneration = generation
    }
    return this.lineElementsCache
  }

  /**
   * Set up scroll event listeners
   */
  setupListeners () {
    this.destroyListeners()

    // CodeMirror uses .CodeMirror-scroll as the actual scroll container
    const cmWrapper = this.editor.getWrapperElement()
    const cmScroll = cmWrapper?.querySelector('.CodeMirror-scroll')

    if (cmScroll && cmScroll.scrollHeight > cmScroll.clientHeight + 10) {
      this._editorScrollContainer = cmScroll
      cmScroll.addEventListener('scroll', this.handleEditorScroll)
    } else {
      const cmHasScroll = cmWrapper?.scrollHeight > cmWrapper?.clientHeight + 10
      if (cmHasScroll) {
        this._editorScrollContainer = cmWrapper
        cmWrapper.addEventListener('scroll', this.handleEditorScroll)
      } else {
        let editorScrollContainer = cmWrapper?.parentElement
        while (editorScrollContainer) {
          const hasScroll = editorScrollContainer.scrollHeight > editorScrollContainer.clientHeight + 10
          if (hasScroll) break
          editorScrollContainer = editorScrollContainer.parentElement
        }
        this._editorScrollContainer = editorScrollContainer
        if (editorScrollContainer) {
          editorScrollContainer.addEventListener('scroll', this.handleEditorScroll)
        }
      }
    }

    if (this.previewContainer) {
      this.previewContainer.addEventListener('scroll', this.handlePreviewScroll)
    }
  }

  /**
   * Remove all listeners
   */
  destroyListeners () {
    if (this._editorScrollContainer) {
      this._editorScrollContainer.removeEventListener('scroll', this.handleEditorScroll)
    }
    if (this.previewContainer) {
      this.previewContainer.removeEventListener('scroll', this.handlePreviewScroll)
    }
  }

  /**
   * Remove all listeners and cleanup
   */
  destroy () {
    this.destroyListeners()
    clearTimeout(this.scrollDisabledTimer)
    this.lineElementsCache = null
  }

  /**
   * Re-setup listeners after layout changes
   */
  reinit () {
    this.setupListeners()
    this.invalidateCache()
  }

  /**
   * Temporarily disable scroll sync to prevent loop
   */
  disableScrollSync () {
    this.scrollDisabledCount++
    clearTimeout(this.scrollDisabledTimer)
    this.scrollDisabledTimer = setTimeout(() => {
      this.scrollDisabledCount = 0
    }, 100)
  }

  /**
   * Check if scroll sync is disabled
   */
  isScrollDisabled () {
    return this.scrollDisabledCount > 0
  }

  /**
   * Sync preview scroll from editor scroll position
   * Uses VS Code's approach: map visible line to preview element
   */
  syncFromEditor () {
    if (this.isScrollDisabled()) return

    const container = this._editorScrollContainer
    if (!container) return

    const scrollTop = container.scrollTop
    const maxScroll = container.scrollHeight - container.clientHeight

    // Handle boundary cases: at top or bottom
    if (scrollTop <= 10) {
      // At top: scroll preview to top
      this.disableScrollSync()
      this.previewContainer.scrollTop = 0
      this.lastEditorLine = 0
      return
    }

    if (scrollTop >= maxScroll - 10) {
      // At bottom: scroll preview to bottom
      this.disableScrollSync()
      this.previewContainer.scrollTop = this.previewContent.offsetHeight - this.previewContainer.clientHeight
      this.lastEditorLine = this.editor.lineCount()
      return
    }

    // Get the line at the top of the visible area
    const lineAtTop = this.editor.lineAtHeight(scrollTop, 'local')

    // Skip if line hasn't changed significantly
    if (Math.abs(lineAtTop - this.lastEditorLine) < 2) return
    this.lastEditorLine = lineAtTop

    // Find corresponding element in preview
    const lineElements = this.getLineElements()
    if (!lineElements || lineElements.length === 0) return

    // Find element with closest data-line value
    let targetElement = null
    for (const el of lineElements) {
      const elLine = parseInt(el.getAttribute('data-line'), 10)
      if (elLine <= lineAtTop) {
        targetElement = el
      }
      if (elLine >= lineAtTop) break
    }

    if (targetElement) {
      this.disableScrollSync()

      // Calculate the target scroll position
      const elementTop = targetElement.offsetTop
      const targetScrollTop = Math.max(0, elementTop - 10)
      this.previewContainer.scrollTop = targetScrollTop
    }
  }

  /**
   * Sync editor scroll from preview scroll position
   * Uses VS Code's approach: map visible element to editor line
   */
  syncFromPreview () {
    if (this.isScrollDisabled()) return

    const container = this._editorScrollContainer
    if (!container) return

    const previewScrollTop = this.previewContainer.scrollTop
    const previewMaxScroll = this.previewContent.offsetHeight - this.previewContainer.clientHeight

    // Handle boundary cases: at top or bottom
    if (previewScrollTop <= 10) {
      // At top: scroll editor to top
      this.disableScrollSync()
      container.scrollTop = 0
      this.lastPreviewLine = 0
      return
    }

    if (previewScrollTop >= previewMaxScroll - 10) {
      // At bottom: scroll editor to bottom
      this.disableScrollSync()
      container.scrollTop = container.scrollHeight - container.clientHeight
      this.lastPreviewLine = this.editor.lineCount()
      return
    }

    // Find the first visible element in preview
    const lineElements = this.getLineElements()
    if (!lineElements || lineElements.length === 0) return

    // Find element closest to current scroll position
    let targetElement = null
    let targetLine = 0

    for (const el of lineElements) {
      const elTop = el.offsetTop
      if (elTop <= previewScrollTop + 50) {
        targetElement = el
        targetLine = parseInt(el.getAttribute('data-line'), 10)
      }
      if (elTop > previewScrollTop + 100) break
    }

    if (targetElement && targetLine >= 0) {
      // Skip if line hasn't changed significantly
      if (Math.abs(targetLine - this.lastPreviewLine) < 2) return
      this.lastPreviewLine = targetLine

      this.disableScrollSync()

      // Get the height position for this line in editor
      const lineTop = this.editor.heightAtLine(targetLine, 'local')
      const targetScrollTop = Math.max(0, lineTop - 10)
      container.scrollTop = targetScrollTop
    }
  }

  /**
   * Invalidate element cache (call after re-render)
   */
  invalidateCache () {
    this.cacheGeneration = -1
    this.lineElementsCache = null
    this.lastEditorLine = -1
    this.lastPreviewLine = -1
  }
}

export default ScrollSyncManager
export { ScrollSyncManager, throttle }
