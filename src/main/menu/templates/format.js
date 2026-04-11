import * as actions from '../actions/format'

export default function (keybindings, i18n) {
  return {
    id: 'formatMenuItem',
    label: (i18n && i18n.menu && i18n.menu.format && i18n.menu.format.label) || 'F&ormat',
    submenu: [{
      id: 'strongMenuItem',
      label: (i18n && i18n.menu && i18n.menu.format && i18n.menu.format.strong) || 'Strong',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('format.strong'),
      click (menuItem, focusedWindow) {
        actions.strong(focusedWindow)
      }
    }, {
      id: 'emphasisMenuItem',
      label: (i18n && i18n.menu && i18n.menu.format && i18n.menu.format.emphasis) || 'Emphasis',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('format.emphasis'),
      click (menuItem, focusedWindow) {
        actions.emphasis(focusedWindow)
      }
    }, {
      id: 'underlineMenuItem',
      label: (i18n && i18n.menu && i18n.menu.format && i18n.menu.format.underline) || 'Underline',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('format.underline'),
      click (menuItem, focusedWindow) {
        actions.underline(focusedWindow)
      }
    }, {
      type: 'separator'
    }, {
      id: 'superscriptMenuItem',
      label: (i18n && i18n.menu && i18n.menu.format && i18n.menu.format.superscript) || 'Superscript',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('format.superscript'),
      click (menuItem, focusedWindow) {
        actions.superscript(focusedWindow)
      }
    }, {
      id: 'subscriptMenuItem',
      label: (i18n && i18n.menu && i18n.menu.format && i18n.menu.format.subscript) || 'Subscript',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('format.subscript'),
      click (menuItem, focusedWindow) {
        actions.subscript(focusedWindow)
      }
    }, {
      id: 'highlightMenuItem',
      label: (i18n && i18n.menu && i18n.menu.format && i18n.menu.format.highlight) || 'Highlight',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('format.highlight'),
      click (menuItem, focusedWindow) {
        actions.highlight(focusedWindow)
      }
    }, {
      type: 'separator'
    }, {
      id: 'inlineCodeMenuItem',
      label: (i18n && i18n.menu && i18n.menu.format && i18n.menu.format.inlineCode) || 'Inline Code',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('format.inline-code'),
      click (menuItem, focusedWindow) {
        actions.inlineCode(focusedWindow)
      }
    }, {
      id: 'inlineMathMenuItem',
      label: (i18n && i18n.menu && i18n.menu.format && i18n.menu.format.inlineMath) || 'Inline Math',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('format.inline-math'),
      click (menuItem, focusedWindow) {
        actions.inlineMath(focusedWindow)
      }
    }, {
      type: 'separator'
    }, {
      id: 'strikeMenuItem',
      label: (i18n && i18n.menu && i18n.menu.format && i18n.menu.format.strikethrough) || 'Strikethrough',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('format.strike'),
      click (menuItem, focusedWindow) {
        actions.strikethrough(focusedWindow)
      }
    }, {
      id: 'hyperlinkMenuItem',
      label: (i18n && i18n.menu && i18n.menu.format && i18n.menu.format.hyperlink) || 'Hyperlink',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('format.hyperlink'),
      click (menuItem, focusedWindow) {
        actions.hyperlink(focusedWindow)
      }
    }, {
      id: 'imageMenuItem',
      label: (i18n && i18n.menu && i18n.menu.format && i18n.menu.format.image) || 'Image',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('format.image'),
      click (menuItem, focusedWindow) {
        actions.image(focusedWindow)
      }
    }, {
      type: 'separator'
    }, {
      label: (i18n && i18n.menu && i18n.menu.format && i18n.menu.format.clearFormat) || 'Clear Format',
      accelerator: keybindings.getAccelerator('format.clear-format'),
      click (menuItem, focusedWindow) {
        actions.clearFormat(focusedWindow)
      }
    }]
  }
}
