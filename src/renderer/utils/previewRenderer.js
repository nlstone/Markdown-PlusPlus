/**
 * Preview Renderer with data-line attribute injection
 *
 * This module renders markdown to HTML with data-line attributes for scroll sync.
 * Reference: VS Code markdown preview implementation
 */

import marked, { Renderer } from '../../muya/lib/parser/marked'
import { sanitize } from '../../muya/lib/utils'
import { EXPORT_DOMPURIFY_CONFIG } from '../../muya/lib/config'

// Custom DOMPurify config that allows data-line attribute for scroll sync
const PREVIEW_DOMPURIFY_CONFIG = Object.freeze({
  ...EXPORT_DOMPURIFY_CONFIG,
  ADD_ATTR: ['data-line', 'data-align'] // Add data-line for scroll sync
})

/**
 * Line number tracking renderer
 * Extends marked's default renderer to inject data-line attributes
 */
class LineTrackingRenderer extends Renderer {
  constructor () {
    super()
    this.currentLine = 0
    this.lineMap = [] // Track which markdown line corresponds to each HTML element
  }

  /**
   * Reset line counter for new document
   */
  reset () {
    this.currentLine = 0
    this.lineMap = []
  }

  /**
   * Helper to wrap content with data-line attribute
   */
  wrapWithLine (html, line) {
    return html.replace(/^<(\w+)/, `<$1 data-line="${line}"`)
  }

  /**
   * Calculate line number from markdown content position
   */
  getLineFromContent (markdown, startPos) {
    const lines = markdown.substring(0, startPos).split('\n')
    return lines.length - 1
  }

  // Block level renderers with data-line injection

  heading (text, level, raw, slugger, headingStyle) {
    const line = this.currentLine++
    const base = `<h${level}>${text}</h${level}>\n`
    return base.replace(/^<h/, `<h data-line="${line}"`)
  }

  paragraph (text) {
    const line = this.currentLine++
    return `<p data-line="${line}">${text}</p>\n`
  }

  code (code, infostring, escaped, codeBlockStyle) {
    const line = this.currentLine
    // Code blocks can span multiple lines, count them
    const codeLines = code.split('\n').length
    this.currentLine += codeLines + 2 // +2 for fence markers
    const result = super.code(code, infostring, escaped, codeBlockStyle)
    return result.replace(/^<pre>/, `<pre data-line="${line}">`)
  }

  blockquote (quote) {
    const line = this.currentLine++
    return `<blockquote data-line="${line}">\n${quote}</blockquote>\n`
  }

  list (body, ordered, start, taskList) {
    const line = this.currentLine++
    const type = ordered ? 'ol' : 'ul'
    const startatt = (ordered && start !== 1) ? (` start="${start}"`) : ''
    return `<${type}${startatt} data-line="${line}">\n${body}</${type}>\n`
  }

  listitem (text, checked) {
    const line = this.currentLine++
    if (checked === undefined) {
      return `<li data-line="${line}">${text}</li>\n`
    }
    // task list
    return `<li class="task-list-item" data-line="${line}"><input type="checkbox"${
      checked ? ' checked=""' : ''
    } disabled=""> ${text}</li>\n`
  }

  table (header, body) {
    const line = this.currentLine++
    if (body) body = `<tbody>${body}</tbody>`
    return `<table data-line="${line}">\n<thead>\n${header}</thead>\n${body}</table>\n`
  }

  hr () {
    const line = this.currentLine++
    return `<hr data-line="${line}">\n`
  }

  html (html) {
    // HTML blocks are tricky, just advance lines based on content
    this.currentLine += html.split('\n').length
    return html
  }

  frontmatter (text) {
    const line = this.currentLine
    const lines = text.split('\n').length
    this.currentLine += lines + 2 // +2 for frontmatter markers
    return `<pre class="front-matter" data-line="${line}">\n${text}</pre>\n`
  }

  multiplemath (text) {
    const line = this.currentLine
    const lines = text.split('\n').length
    this.currentLine += lines + 2
    return `<pre class="multiple-math" data-line="${line}">\n${text}</pre>\n`
  }
}

// Singleton renderer instance
const lineTrackingRenderer = new LineTrackingRenderer()

/**
 * Render markdown to HTML with data-line attributes
 *
 * @param {string} markdown - The markdown content to render
 * @param {object} options - Optional rendering options
 * @returns {string} - HTML string with data-line attributes
 */
export function renderMarkdownWithLines (markdown, options = {}) {
  lineTrackingRenderer.reset()

  const renderOptions = {
    renderer: lineTrackingRenderer,
    ...options
  }

  let html = marked(markdown, renderOptions)

  // Sanitize HTML for security - use custom config that allows data-line
  html = sanitize(html, PREVIEW_DOMPURIFY_CONFIG, false)

  return html
}

/**
 * Find the HTML element that corresponds to a given line number
 *
 * @param {HTMLElement} container - The preview container
 * @param {number} line - The source code line number
 * @returns {HTMLElement|null} - The corresponding element or null
 */
export function findElementForLine (container, line) {
  // Find elements with data-line attribute
  const elements = container.querySelectorAll('[data-line]')

  // Binary search for efficiency
  let closestElement = null
  let closestLine = -1

  for (const el of elements) {
    const elLine = parseInt(el.getAttribute('data-line'), 10)
    if (elLine <= line && elLine > closestLine) {
      closestElement = el
      closestLine = elLine
    }
  }

  return closestElement
}

/**
 * Find the line number corresponding to a scroll position in preview
 *
 * @param {HTMLElement} container - The preview container
 * @param {number} scrollTop - The current scroll position
 * @returns {number} - The estimated source code line number
 */
export function findLineForScrollPosition (container, scrollTop) {
  const elements = container.querySelectorAll('[data-line]')

  let prevElement = null
  let prevLine = 0
  let prevTop = 0

  for (const el of elements) {
    const elTop = el.offsetTop
    const elLine = parseInt(el.getAttribute('data-line'), 10)

    if (elTop > scrollTop) {
      // We're between prevElement and this element
      if (prevElement) {
        // Interpolate line number based on scroll position
        const ratio = (scrollTop - prevTop) / (elTop - prevTop)
        return Math.floor(prevLine + ratio * (elLine - prevLine))
      }
      return elLine
    }

    prevElement = el
    prevLine = elLine
    prevTop = elTop
  }

  return prevLine
}

export default {
  renderMarkdownWithLines,
  findElementForLine,
  findLineForScrollPosition
}
