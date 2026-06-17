/**
 * Wiki Exporter Service
 *
 * Exports ZRead / .md++ wiki documentation as self-contained HTML (SPA)
 * or PDF. The HTML output embeds Mermaid for offline diagram rendering.
 */

import { ipcRenderer } from 'electron'
import { app as remoteApp } from '@electron/remote'
import fs from 'fs'
import path from 'path'

// ============================================================================
// IPC Helpers
// ============================================================================

// ============================================================================
// File Reading
// ============================================================================

/**
 * Read all wiki pages from disk
 * @param {Object} options
 * @param {string} options.rootPath - Project root path
 * @param {string} options.versionPath - Version path (e.g. "versions/20260601")
 * @param {string} options.wikiDirPrefix - ".zread/wiki" or ".md++/wiki"
 * @param {Array} options.pages - Page metadata from wiki.json
 * @returns {Object} { wikiJson, pages: [{ slug, title, file, section, group, level, content }] }
 */
export async function readAllWikiPages ({ rootPath, versionPath, wikiDirPrefix, pages }) {
  const versionDir = path.join(rootPath, wikiDirPrefix, versionPath)

  // Read wiki.json
  const wikiJsonPath = path.join(versionDir, 'wiki.json')
  let wikiJson = {}
  try {
    wikiJson = JSON.parse(fs.readFileSync(wikiJsonPath, 'utf-8'))
  } catch (err) {
    console.warn('[WikiExporter] Failed to read wiki.json:', err.message)
  }

  // Read all page files
  const filePaths = pages.map(p => p.file)
  const absolutePaths = filePaths.map(f => path.join(versionDir, f))

  const fileContents = {}
  for (const absPath of absolutePaths) {
    try {
      fileContents[absPath] = fs.readFileSync(absPath, 'utf-8')
    } catch (err) {
      console.warn(`[WikiExporter] Failed to read ${absPath}:`, err.message)
    }
  }

  // Build pages array with content
  const pagesWithContent = pages.map((page, i) => {
    const absPath = absolutePaths[i]
    return {
      ...page,
      slug: page.slug || generateSlug(i, page.title),
      content: fileContents[absPath] || ''
    }
  })

  return { wikiJson, pages: pagesWithContent }
}

function generateSlug (index, title) {
  return `${index + 1}-${title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40) || 'page'}`
}

// ============================================================================
// Simple Markdown to HTML Converter
// ============================================================================

function escapeHtml (text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderInlineMarkdown (text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%">')
}

/**
 * Convert markdown text to HTML
 * Handles: headings, code blocks, mermaid, tables, lists, blockquotes,
 * details/summary, paragraphs, horizontal rules, inline formatting
 */
export function markdownToHtml (markdown) {
  if (!markdown) return ''

  const lines = markdown.split('\n')
  const result = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block (```mermaid, ```javascript, etc.)
    if (line.trimStart().startsWith('```')) {
      const lang = line.trim().slice(3).trim()
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```

      const code = escapeHtml(codeLines.join('\n'))
      if (lang === 'mermaid') {
        result.push(`<div class="mermaid-block"><pre class="mermaid-code">${code}</pre></div>`)
      } else {
        result.push(`<pre><code class="language-${lang}">${code}</code></pre>`)
      }
      continue
    }

    // Details/Summary block
    if (line.trim().startsWith('<details>')) {
      const blockLines = [line]
      let depth = 1
      i++
      while (i < lines.length && depth > 0) {
        if (lines[i].trim().startsWith('<details>')) depth++
        if (lines[i].trim().startsWith('</details>')) depth--
        blockLines.push(lines[i])
        i++
      }
      // Pass through as-is (HTML)
      result.push(blockLines.join('\n'))
      continue
    }

    // Horizontal rule
    if (/^(\s*[-*_]\s*){3,}$/.test(line)) {
      result.push('<hr>')
      i++
      continue
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const text = renderInlineMarkdown(headingMatch[2])
      const slug = headingMatch[2].toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '')
      result.push(`<h${level} id="${slug}">${text}</h${level}>`)
      i++
      continue
    }

    // Table
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?\s*[-:]+[-| :]*$/.test(lines[i + 1])) {
      const tableLines = []
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i])
        i++
      }
      result.push(renderTable(tableLines))
      continue
    }

    // Unordered list (- or * or +)
    if (/^\s*[-*+]\s+/.test(line)) {
      const listItems = []
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*[-*+]\s+/, ''))
        i++
      }
      result.push('<ul>' + listItems.map(item =>
        `<li>${renderInlineMarkdown(item)}</li>`
      ).join('') + '</ul>')
      continue
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*\d+\.\s+/, ''))
        i++
      }
      result.push('<ol>' + listItems.map(item =>
        `<li>${renderInlineMarkdown(item)}</li>`
      ).join('') + '</ol>')
      continue
    }

    // Blockquote
    if (line.trim().startsWith('>')) {
      const quoteLines = []
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ''))
        i++
      }
      result.push(`<blockquote>${renderInlineMarkdown(quoteLines.join(' '))}</blockquote>`)
      continue
    }

    // Empty line
    if (line.trim() === '') {
      i++
      continue
    }

    // Paragraph: collect consecutive non-empty lines
    const paraLines = []
    while (i < lines.length && lines[i].trim() !== '' &&
      !lines[i].trimStart().startsWith('```') &&
      !lines[i].match(/^#{1,6}\s/) &&
      !lines[i].trim().startsWith('>') &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^(\s*[-*_]\s*){3,}$/.test(lines[i]) &&
      !(lines[i].includes('|') && i + 1 < lines.length && /^\s*\|?\s*[-:]+[-| :]*$/.test(lines[i + 1]))
    ) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      result.push(`<p>${renderInlineMarkdown(paraLines.join(' '))}</p>`)
    }
  }

  return result.join('\n')
}

function renderTable (tableLines) {
  if (tableLines.length < 2) return ''

  const parseRow = (line) => {
    return line.split('|').map(c => c.trim()).filter((c, i, arr) => {
      // Remove empty first/last cells from leading/trailing |
      if (i === 0 && c === '') return false
      if (i === arr.length - 1 && c === '') return false
      return true
    })
  }

  const headerCells = parseRow(tableLines[0])
  // Skip separator row (index 1)
  const bodyRows = tableLines.slice(2).map(parseRow)

  let html = '<table><thead><tr>'
  headerCells.forEach(cell => {
    html += `<th>${renderInlineMarkdown(cell)}</th>`
  })
  html += '</tr></thead><tbody>'
  bodyRows.forEach(row => {
    html += '<tr>'
    row.forEach(cell => {
      html += `<td>${renderInlineMarkdown(cell)}</td>`
    })
    html += '</tr>'
  })
  html += '</tbody></table>'
  return html
}

// ============================================================================
// Read embedded assets
// ============================================================================

/**
 * Read mermaid.min.js from node_modules
 */
function readMermaidLib () {
  try {
    const appPath = remoteApp.getAppPath()
    const mermaidPath = path.join(appPath, 'node_modules', 'mermaid', 'dist', 'mermaid.min.js')
    return fs.readFileSync(mermaidPath, 'utf-8')
  } catch (err) {
    console.warn('[WikiExporter] Failed to read mermaid.min.js:', err.message)
    return ''
  }
}

// ============================================================================
// HTML Template (SPA)
// ============================================================================

function generateSidebarHtml (pages) {
  // Group pages by section
  const sections = {}
  for (const page of pages) {
    const section = page.section || 'Other'
    if (!sections[section]) {
      sections[section] = []
    }
    sections[section].push(page)
  }

  let html = ''
  for (const [sectionName, sectionPages] of Object.entries(sections)) {
    html += `<div class="nav-section">
      <div class="nav-section-title" onclick="toggleSection(this)">
        <span class="nav-arrow">&#9660;</span> ${escapeHtml(sectionName)}
      </div>
      <div class="nav-section-pages">`
    for (const page of sectionPages) {
      const levelClass = page.level ? ` level-${page.level.toLowerCase()}` : ''
      html += `<div class="nav-page${levelClass}" data-slug="${escapeHtml(page.slug)}" onclick="showPage('${escapeHtml(page.slug)}')">
          ${escapeHtml(page.title)}
        </div>`
    }
    html += '</div></div>'
  }
  return html
}

/**
 * Generate self-contained HTML SPA for wiki export
 * @param {Object} options
 * @param {string} options.title - Document title
 * @param {Array} options.pages - Pages with { slug, title, content, section, level }
 * @returns {string} Complete HTML string
 */
export function generateWikiHtml ({ title, pages }) {
  const mermaidLib = readMermaidLib()

  // Prepare page data as JSON
  const pagesData = pages.map(p => ({
    slug: p.slug,
    title: p.title,
    section: p.section || '',
    level: p.level || '',
    html: markdownToHtml(p.content)
  }))

  const sidebarHtml = generateSidebarHtml(pages)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title || 'Wiki Documentation')}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      display: flex; height: 100vh; overflow: hidden; background: #fff; color: #24292e;
    }

    /* Sidebar */
    #sidebar {
      width: 280px; min-width: 280px; background: #f6f8fa; border-right: 1px solid #e1e4e8;
      overflow-y: auto; padding: 16px 0; display: flex; flex-direction: column;
    }
    #sidebar-header {
      padding: 0 16px 12px; border-bottom: 1px solid #e1e4e8; margin-bottom: 8px;
    }
    #sidebar-header h2 { font-size: 16px; font-weight: 600; color: #24292e; }
    #sidebar-header p { font-size: 12px; color: #586069; margin-top: 4px; }
    #sidebar-search {
      margin: 8px 16px; padding: 6px 10px; border: 1px solid #e1e4e8; border-radius: 4px;
      font-size: 13px; width: calc(100% - 32px); outline: none;
    }
    #sidebar-search:focus { border-color: #0366d6; }
    .nav-section { margin-bottom: 4px; }
    .nav-section-title {
      padding: 6px 16px; font-size: 13px; font-weight: 600; color: #24292e;
      cursor: pointer; user-select: none; display: flex; align-items: center;
    }
    .nav-section-title:hover { background: #e1e4e8; }
    .nav-arrow { font-size: 10px; margin-right: 6px; transition: transform 0.15s; display: inline-block; width: 12px; }
    .nav-section.collapsed .nav-arrow { transform: rotate(-90deg); }
    .nav-section.collapsed .nav-section-pages { display: none; }
    .nav-page {
      padding: 5px 16px 5px 34px; font-size: 13px; color: #586069;
      cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .nav-page:hover { background: #e1e4e8; color: #24292e; }
    .nav-page.active { background: #0366d6; color: #fff; border-radius: 0; }
    .nav-page.level-beginner::before { content: ""; display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #28a745; margin-right: 6px; }
    .nav-page.level-intermediate::before { content: ""; display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #f9a825; margin-right: 6px; }
    .nav-page.level-advanced::before { content: ""; display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #d73a49; margin-right: 6px; }

    /* Content */
    #content {
      flex: 1; overflow-y: auto; padding: 32px 48px; max-width: 900px;
    }
    #page-title { font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #24292e; border-bottom: 1px solid #e1e4e8; padding-bottom: 8px; }

    /* Markdown body styles */
    .markdown-body h1 { font-size: 2em; margin: 0.67em 0; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    .markdown-body h2 { font-size: 1.5em; margin: 1em 0 0.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    .markdown-body h3 { font-size: 1.25em; margin: 1em 0 0.5em; }
    .markdown-body h4 { font-size: 1em; margin: 1em 0 0.5em; }
    .markdown-body p { margin: 0 0 16px; line-height: 1.6; }
    .markdown-body a { color: #0366d6; text-decoration: none; }
    .markdown-body a:hover { text-decoration: underline; }
    .markdown-body code {
      background: #f6f8fa; padding: 0.2em 0.4em; border-radius: 3px;
      font-size: 85%; font-family: "SFMono-Regular", Consolas, monospace;
    }
    .markdown-body pre {
      background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto;
      margin: 0 0 16px; line-height: 1.45;
    }
    .markdown-body pre code { background: transparent; padding: 0; font-size: 85%; }
    .markdown-body blockquote {
      border-left: 4px solid #dfe2e5; padding: 0 16px; color: #6a737d; margin: 0 0 16px;
    }
    .markdown-body table { border-collapse: collapse; width: 100%; margin: 0 0 16px; }
    .markdown-body th, .markdown-body td {
      border: 1px solid #dfe2e5; padding: 6px 13px; text-align: left;
    }
    .markdown-body th { background: #f6f8fa; font-weight: 600; }
    .markdown-body tr:nth-child(even) { background: #f6f8fa; }
    .markdown-body ul, .markdown-body ol { padding-left: 2em; margin: 0 0 16px; }
    .markdown-body li { margin: 4px 0; line-height: 1.6; }
    .markdown-body hr { border: none; border-top: 1px solid #eaecef; margin: 24px 0; }
    .markdown-body img { max-width: 100%; }
    .markdown-body del { color: #6a737d; }

    /* Details/Summary */
    .markdown-body details { margin: 0 0 16px; padding: 12px 16px; background: #f6f8fa; border-radius: 6px; border: 1px solid #e1e4e8; }
    .markdown-body details summary { cursor: pointer; font-weight: 600; color: #24292e; }
    .markdown-body details[open] summary { margin-bottom: 8px; }

    /* Mermaid */
    .mermaid-block { margin: 16px 0; text-align: center; }
    .mermaid-code { background: #f0f0f0; text-align: left; }
    .mermaid-block svg { max-width: 100%; }
    .mermaid-error { color: #d73a49; font-size: 13px; padding: 8px; background: #ffeef0; border-radius: 4px; }

    /* Print styles */
    @media print {
      #sidebar { display: none; }
      #content { max-width: 100%; padding: 0; }
    }
  </style>
</head>
<body>
  <div id="sidebar">
    <div id="sidebar-header">
      <h2>${escapeHtml(title || 'Wiki Documentation')}</h2>
      <p>${pages.length} pages</p>
    </div>
    <input type="text" id="sidebar-search" placeholder="Search pages..." oninput="filterPages(this.value)">
    <div id="nav-tree">
      ${sidebarHtml}
    </div>
  </div>
  <div id="content">
    <div id="page-title"></div>
    <div id="page-body" class="markdown-body"></div>
  </div>

  <script>
  // Mermaid library
  ${mermaidLib}

  // Page data
  var PAGES = ${JSON.stringify(pagesData)};
  var currentSlug = '';

  function showPage(slug) {
    var page = PAGES.find(function(p) { return p.slug === slug; });
    if (!page) return;
    currentSlug = slug;
    document.getElementById('page-title').textContent = page.title;
    document.getElementById('page-body').innerHTML = page.html;

    // Update active state
    document.querySelectorAll('.nav-page').forEach(function(el) {
      el.classList.toggle('active', el.dataset.slug === slug);
    });

    // Scroll to top
    document.getElementById('content').scrollTop = 0;

    // Render mermaid diagrams
    renderMermaid();
  }

  function renderMermaid() {
    if (typeof mermaid === 'undefined') return;
    var blocks = document.querySelectorAll('.mermaid-code');
    blocks.forEach(function(block) {
      var parent = block.parentNode;
      if (parent.querySelector('svg')) return; // Already rendered
      var code = block.textContent;
      var id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
      try {
        mermaid.render(id, code).then(function(result) {
          parent.innerHTML = result.svg;
        }).catch(function(err) {
          parent.innerHTML = '<div class="mermaid-error">Diagram error: ' + err.message + '</div>';
        });
      } catch (e) {
        parent.innerHTML = '<div class="mermaid-error">Diagram error: ' + e.message + '</div>';
      }
    });
  }

  function toggleSection(el) {
    el.parentNode.classList.toggle('collapsed');
  }

  function filterPages(query) {
    query = query.toLowerCase();
    document.querySelectorAll('.nav-page').forEach(function(el) {
      var text = el.textContent.toLowerCase();
      el.style.display = text.includes(query) ? '' : 'none';
    });
    // Show all sections when filtering
    if (query) {
      document.querySelectorAll('.nav-section').forEach(function(s) {
        s.classList.remove('collapsed');
      });
    }
  }

  // Initialize mermaid
  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
  }

  // Show first page
  if (PAGES.length > 0) {
    showPage(PAGES[0].slug);
  }
  </script>
</body>
</html>`
}

// ============================================================================
// PDF HTML Template (print-optimized)
// ============================================================================

/**
 * Generate print-optimized HTML for PDF conversion
 * All pages are laid out vertically with page breaks between them.
 * Mermaid diagrams are rendered inline.
 * @param {Object} options
 * @param {string} options.title - Document title
 * @param {Array} options.pages - Pages with { slug, title, content, section, level }
 * @returns {string} Complete HTML string for PDF rendering
 */
export function generateWikiPdfHtml ({ title, pages }) {
  // Build table of contents
  let tocHtml = '<div class="toc"><h2>Table of Contents</h2><ul>'
  pages.forEach(page => {
    tocHtml += `<li><a href="#${escapeHtml(page.slug)}">${escapeHtml(page.title)}</a></li>`
  })
  tocHtml += '</ul></div>'

  // Build page content
  let pagesHtml = ''
  pages.forEach((page, index) => {
    const pageBreak = index > 0 ? ' style="page-break-before: always;"' : ''
    pagesHtml += `<div class="wiki-page" id="${escapeHtml(page.slug)}"${pageBreak}>
      <h1 class="page-title">${escapeHtml(page.title)}</h1>
      <div class="markdown-body">${markdownToHtml(page.content)}</div>
    </div>`
  })

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title || 'Wiki Documentation')}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      color: #24292e; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px;
    }

    /* TOC */
    .toc { margin-bottom: 32px; page-break-after: always; }
    .toc h2 { font-size: 24px; margin-bottom: 16px; border-bottom: 2px solid #24292e; padding-bottom: 8px; }
    .toc ul { list-style: none; padding: 0; }
    .toc li { margin: 6px 0; }
    .toc a { color: #0366d6; text-decoration: none; font-size: 15px; }
    .toc a:hover { text-decoration: underline; }

    /* Page titles */
    .page-title { font-size: 24px; font-weight: 600; margin-bottom: 16px; border-bottom: 1px solid #eaecef; padding-bottom: 8px; }

    /* Markdown body (same as SPA but with print adjustments) */
    .markdown-body h1 { font-size: 2em; margin: 0.67em 0; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    .markdown-body h2 { font-size: 1.5em; margin: 1em 0 0.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    .markdown-body h3 { font-size: 1.25em; margin: 1em 0 0.5em; }
    .markdown-body h4 { font-size: 1em; margin: 1em 0 0.5em; }
    .markdown-body p { margin: 0 0 16px; line-height: 1.6; }
    .markdown-body a { color: #0366d6; text-decoration: none; }
    .markdown-body code {
      background: #f6f8fa; padding: 0.2em 0.4em; border-radius: 3px;
      font-size: 85%; font-family: "SFMono-Regular", Consolas, monospace;
    }
    .markdown-body pre {
      background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto;
      margin: 0 0 16px; line-height: 1.45; white-space: pre-wrap; word-wrap: break-word;
    }
    .markdown-body pre code { background: transparent; padding: 0; font-size: 85%; }
    .markdown-body blockquote {
      border-left: 4px solid #dfe2e5; padding: 0 16px; color: #6a737d; margin: 0 0 16px;
    }
    .markdown-body table { border-collapse: collapse; width: 100%; margin: 0 0 16px; }
    .markdown-body th, .markdown-body td {
      border: 1px solid #dfe2e5; padding: 6px 13px; text-align: left;
    }
    .markdown-body th { background: #f6f8fa; font-weight: 600; }
    .markdown-body ul, .markdown-body ol { padding-left: 2em; margin: 0 0 16px; }
    .markdown-body li { margin: 4px 0; line-height: 1.6; }
    .markdown-body hr { border: none; border-top: 1px solid #eaecef; margin: 24px 0; }
    .markdown-body img { max-width: 100%; }
    .markdown-body del { color: #6a737d; }

    /* Details/Summary */
    .markdown-body details { margin: 0 0 16px; padding: 12px 16px; background: #f6f8fa; border-radius: 6px; border: 1px solid #e1e4e8; }
    .markdown-body details summary { cursor: pointer; font-weight: 600; }

    /* Mermaid (placeholder for PDF - will be rendered by mermaid lib) */
    .mermaid-block { margin: 16px 0; text-align: center; page-break-inside: avoid; }
    .mermaid-code { background: #f0f0f0; text-align: left; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 12px; }
    .mermaid-block svg { max-width: 100%; }

    @media print {
      body { padding: 0; }
      .wiki-page { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1 style="text-align:center; margin-bottom: 8px;">${escapeHtml(title || 'Wiki Documentation')}</h1>
  <p style="text-align:center; color: #586069; margin-bottom: 32px;">${pages.length} pages &middot; Generated by MarkDown++</p>
  ${tocHtml}
  ${pagesHtml}

  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>
  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({ startOnLoad: true, theme: 'default', securityLevel: 'loose' });
  }
  </script>
</body>
</html>`
}

// ============================================================================
// Export Entry Point
// ============================================================================

/**
 * Export wiki as HTML or PDF
 * @param {string} format - 'html' or 'pdf'
 * @param {Object} wikiData - { title, pages: [{ slug, title, content, section, level }] }
 * @returns {Promise<{type, filePath}>}
 */
export async function exportWiki (format, wikiData) {
  let content
  if (format === 'pdf') {
    content = generateWikiPdfHtml(wikiData)
  } else {
    content = generateWikiHtml(wikiData)
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Export timeout')), 120000)

    ipcRenderer.once('mt::export-wiki-success', (e, result) => {
      clearTimeout(timeout)
      resolve(result)
    })
    ipcRenderer.once('mt::export-wiki-error', (e, error) => {
      clearTimeout(timeout)
      reject(new Error(error.message || 'Export failed'))
    })

    ipcRenderer.send('mt::export-wiki', {
      type: format,
      content,
      title: wikiData.title || 'wiki'
    })
  })
}

export default {
  readAllWikiPages,
  markdownToHtml,
  generateWikiHtml,
  generateWikiPdfHtml,
  exportWiki
}
