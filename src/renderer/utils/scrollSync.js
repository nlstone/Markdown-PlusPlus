/**
 * Scroll Sync Manager
 *
 * Implements bidirectional scroll synchronization between CodeMirror editor
 * and HTML preview pane, similar to VS Code's markdown preview.
 *
 * Key concepts:
 * - With viewportMargin: Infinity, CodeMirror renders the whole document
 * - Scroll happens on the parent container, not inside CodeMirror
 * - Use scroll ratio (0-1) to sync between editor and preview
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
    this.lastEditorScrollTop = 0
    this.lastPreviewScrollTop = 0

    // Cached elements with data-line
    this.lineElementsCache = null
    this.cacheVersion = -1

    // Bind scroll handlers with throttle
    this.handleEditorScroll = throttle(this.syncFromEditor.bind(this), 50)
    this.handlePreviewScroll = throttle(this.syncFromPreview.bind(this), 50)

    // Set up listeners
    this.setupListeners()
  }

  /**
   * Set up scroll event listeners
   */
  setupListeners () {
    // Remove existing listeners first
    this.destroyListeners()

    // Find the actual scroll container for the editor
    // With viewportMargin: Infinity, CodeMirror renders the whole document
    // and the scroll happens on the parent container, not inside CodeMirror
    let editorScrollContainer = this.editor.getWrapperElement()?.parentElement

    // Walk up the DOM tree to find a scrollable container
    // A scrollable container has scrollHeight > clientHeight
    while (editorScrollContainer) {
      const hasScroll = editorScrollContainer.scrollHeight > editorScrollContainer.clientHeight + 10
      if (hasScroll) {
        break
      }
      editorScrollContainer = editorScrollContainer.parentElement
    }

    this._editorScrollContainer = editorScrollContainer

    // Editor scroll listener - listen on the actual scrollable parent container
    if (editorScrollContainer) {
      editorScrollContainer.addEventListener('scroll', this.handleEditorScroll)
    }

    // Preview scroll listener
    if (this.previewContainer) {
      this.previewContainer.addEventListener('scroll', this.handlePreviewScroll)
    }
  }

  /**
   * Remove all listeners (but keep the manager alive for re-setup)
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
  }

  /**
   * Re-setup listeners after layout changes
   */
  reinit () {
    this.setupListeners()
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
   */
  syncFromEditor () {
    if (this.isScrollDisabled()) return

    const container = this._editorScrollContainer
    if (!container) return

    const editorTop = container.scrollTop
    const containerHeight = container.clientHeight
    const contentHeight = container.scrollHeight

    // Skip if scroll hasn't changed significantly
    if (Math.abs(editorTop - this.lastEditorScrollTop) < 5) return
    this.lastEditorScrollTop = editorTop

    // Calculate the scroll ratio (0 to 1)
    const maxScroll = contentHeight - containerHeight
    const scrollRatio = maxScroll > 0 ? editorTop / maxScroll : 0

    // Disable preview scroll listener temporarily
    this.disableScrollSync()

    // Calculate scroll position in preview using same ratio
    const previewContentHeight = this.previewContent.offsetHeight
    const previewContainerHeight = this.previewContainer.clientHeight
    const previewMaxScroll = previewContentHeight - previewContainerHeight
    const previewScrollTo = scrollRatio * previewMaxScroll

    this.previewContainer.scrollTop = Math.max(0, previewScrollTo)
  }

  /**
   * Sync editor scroll from preview scroll position
   */
  syncFromPreview () {
    if (this.isScrollDisabled()) return

    const container = this._editorScrollContainer
    if (!container) return

    const previewTop = this.previewContainer.scrollTop

    // Skip if scroll hasn't changed significantly
    if (Math.abs(previewTop - this.lastPreviewScrollTop) < 5) return
    this.lastPreviewScrollTop = previewTop

    // Calculate scroll ratio in preview
    const previewContentHeight = this.previewContent.offsetHeight
    const previewContainerHeight = this.previewContainer.clientHeight
    const previewMaxScroll = previewContentHeight - previewContainerHeight
    const scrollRatio = previewMaxScroll > 0 ? previewTop / previewMaxScroll : 0

    // Apply same ratio to editor container
    const editorContainerHeight = container.clientHeight
    const editorContentHeight = container.scrollHeight
    const editorMaxScroll = editorContentHeight - editorContainerHeight
    const editorScrollTo = scrollRatio * editorMaxScroll

    // Disable editor scroll listener temporarily
    this.disableScrollSync()
    container.scrollTop = Math.max(0, editorScrollTo)
  }

  /**
   * Invalidate element cache (call after re-render)
   */
  invalidateCache () {
    this.cacheVersion = -1
    this.lineElementsCache = null
  }
}

export default ScrollSyncManager
export { ScrollSyncManager, throttle }
