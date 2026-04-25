// NOTE: These are mutable fields that may change at runtime.

export const CUT = {
  label: 'Cut',
  id: 'cutMenuItem',
  role: 'cut'
}

export const COPY = {
  label: 'Copy',
  id: 'copyMenuItem',
  role: 'copy'
}

export const PASTE = {
  label: 'Paste',
  id: 'pasteMenuItem',
  role: 'paste'
}

export const COPY_AS_MARKDOWN = {
  label: 'Copy As Markdown',
  id: 'copyAsMarkdownMenuItem',
  click (menuItem, targetWindow) {
    targetWindow.webContents.send('mt::cm-copy-as-markdown')
  }
}

export const COPY_AS_HTML = {
  label: 'Copy As Html',
  id: 'copyAsHtmlMenuItem',
  click (menuItem, targetWindow) {
    targetWindow.webContents.send('mt::cm-copy-as-html')
  }
}

export const PASTE_AS_PLAIN_TEXT = {
  label: 'Paste as Plain Text',
  id: 'pasteAsPlainTextMenuItem',
  click (menuItem, targetWindow) {
    targetWindow.webContents.send('mt::cm-paste-as-plain-text')
  }
}

export const INSERT_BEFORE = {
  label: 'Insert Paragraph Before',
  id: 'insertParagraphBeforeMenuItem',
  click (menuItem, targetWindow) {
    targetWindow.webContents.send('mt::cm-insert-paragraph', 'before')
  }
}

export const INSERT_AFTER = {
  label: 'Insert Paragraph After',
  id: 'insertParagraphAfterMenuItem',
  click (menuItem, targetWindow) {
    targetWindow.webContents.send('mt::cm-insert-paragraph', 'after')
  }
}

export const SEPARATOR = {
  type: 'separator'
}

export const AI_SMART_REWRITE = {
  label: 'AI Smart Rewrite',
  id: 'aiSmartRewriteMenuItem',
  click (menuItem, targetWindow) {
    targetWindow.webContents.send('mt::cm-ai-smart-rewrite')
  }
}

/**
 * Apply i18n translations to menu items
 * @param {object} i18n The i18n object containing translations
 */
export const applyTranslations = (i18n) => {
  if (i18n && i18n.contextMenu && i18n.contextMenu.editor) {
    const t = i18n.contextMenu.editor
    CUT.label = t.cut || 'Cut'
    COPY.label = t.copy || 'Copy'
    PASTE.label = t.paste || 'Paste'
    COPY_AS_MARKDOWN.label = t.copyAsMarkdown || 'Copy As Markdown'
    COPY_AS_HTML.label = t.copyAsHtml || 'Copy As Html'
    PASTE_AS_PLAIN_TEXT.label = t.pasteAsPlainText || 'Paste as Plain Text'
    INSERT_BEFORE.label = t.insertParagraphBefore || 'Insert Paragraph Before'
    INSERT_AFTER.label = t.insertParagraphAfter || 'Insert Paragraph After'
    AI_SMART_REWRITE.label = t.aiSmartRewrite || 'AI Smart Rewrite'
  }
}
