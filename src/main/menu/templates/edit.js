import * as actions from '../actions/edit'
import { isOsx } from '../../config'
import { COMMANDS } from '../../commands'

export default function (keybindings, i18n) {
  return {
    label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.label) || '&Edit',
    submenu: [{
      label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.undo) || 'Undo',
      accelerator: keybindings.getAccelerator(COMMANDS.EDIT_UNDO),
      click: (menuItem, browserWindow) => {
        actions.editorUndo(browserWindow)
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.redo) || 'Redo',
      accelerator: keybindings.getAccelerator(COMMANDS.EDIT_REDO),
      click: (menuItem, browserWindow) => {
        actions.editorRedo(browserWindow)
      }
    }, {
      type: 'separator'
    }, {
      label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.cut) || 'Cut',
      accelerator: keybindings.getAccelerator(COMMANDS.EDIT_CUT),
      click (menuItem, browserWindow) {
        actions.nativeCut(browserWindow)
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.copy) || 'Copy',
      accelerator: keybindings.getAccelerator(COMMANDS.EDIT_COPY),
      click (menuItem, browserWindow) {
        actions.nativeCopy(browserWindow)
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.paste) || 'Paste',
      accelerator: keybindings.getAccelerator(COMMANDS.EDIT_PASTE),
      click (menuItem, browserWindow) {
        actions.nativePaste(browserWindow)
      }
    }, {
      type: 'separator'
    }, {
      label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.copyAsMarkdown) || 'Copy as Markdown',
      accelerator: keybindings.getAccelerator(COMMANDS.EDIT_COPY_AS_MARKDOWN),
      click (menuItem, browserWindow) {
        actions.editorCopyAsMarkdown(browserWindow)
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.copyAsHtml) || 'Copy as HTML',
      accelerator: keybindings.getAccelerator(COMMANDS.EDIT_COPY_AS_HTML),
      click (menuItem, browserWindow) {
        actions.editorCopyAsHtml(browserWindow)
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.pasteAsPlainText) || 'Paste as Plain Text',
      accelerator: keybindings.getAccelerator(COMMANDS.EDIT_PASTE_AS_PLAINTEXT),
      click (menuItem, browserWindow) {
        actions.editorPasteAsPlainText(browserWindow)
      }
    }, {
      type: 'separator'
    }, {
      label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.selectAll) || 'Select All',
      accelerator: keybindings.getAccelerator(COMMANDS.EDIT_SELECT_ALL),
      click (menuItem, browserWindow) {
        actions.editorSelectAll(browserWindow)
      }
    }, {
      type: 'separator'
    }, {
      label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.duplicate) || 'Duplicate',
      accelerator: keybindings.getAccelerator(COMMANDS.EDIT_DUPLICATE),
      click (menuItem, browserWindow) {
        actions.editorDuplicate(browserWindow)
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.createParagraph) || 'Create Paragraph',
      accelerator: keybindings.getAccelerator(COMMANDS.EDIT_CREATE_PARAGRAPH),
      click (menuItem, browserWindow) {
        actions.editorCreateParagraph(browserWindow)
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.deleteParagraph) || 'Delete Paragraph',
      accelerator: keybindings.getAccelerator(COMMANDS.EDIT_DELETE_PARAGRAPH),
      click (menuItem, browserWindow) {
        actions.editorDeleteParagraph(browserWindow)
      }
    }, {
      type: 'separator'
    }, {
      label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.find) || 'Find',
      accelerator: keybindings.getAccelerator(COMMANDS.EDIT_FIND),
      click (menuItem, browserWindow) {
        actions.editorFind(browserWindow)
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.findNext) || 'Find Next',
      accelerator: keybindings.getAccelerator(COMMANDS.EDIT_FIND_NEXT),
      click (menuItem, browserWindow) {
        actions.editorFindNext(browserWindow)
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.findPrevious) || 'Find Previous',
      accelerator: keybindings.getAccelerator(COMMANDS.EDIT_FIND_PREVIOUS),
      click (menuItem, browserWindow) {
        actions.editorFindPrevious(browserWindow)
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.replace) || 'Replace',
      accelerator: keybindings.getAccelerator(COMMANDS.EDIT_REPLACE),
      click (menuItem, browserWindow) {
        actions.editorReplace(browserWindow)
      }
    }, {
      type: 'separator'
    }, {
      label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.findInFolder) || 'Find in Folder',
      accelerator: keybindings.getAccelerator(COMMANDS.EDIT_FIND_IN_FOLDER),
      click (menuItem, browserWindow) {
        actions.findInFolder(browserWindow)
      }
    }, {
      type: 'separator'
    }, {
      label: 'Screenshot',
      id: 'screenshot',
      visible: isOsx,
      accelerator: keybindings.getAccelerator(COMMANDS.EDIT_SCREENSHOT),
      click (menuItem, browserWindow) {
        actions.screenshot(browserWindow)
      }
    }, {
      type: 'separator'
    }, {
      // TODO: Remove this menu entry and add it to the command palette (#1408).
      label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.lineEnding) || 'Line Ending',
      submenu: [{
        id: 'crlfLineEndingMenuEntry',
        label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.crlf) || 'Carriage return and line feed (CRLF)',
        type: 'radio',
        click (menuItem, browserWindow) {
          actions.lineEnding(browserWindow, 'crlf')
        }
      }, {
        id: 'lfLineEndingMenuEntry',
        label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.lf) || 'Line feed (LF)',
        type: 'radio',
        click (menuItem, browserWindow) {
          actions.lineEnding(browserWindow, 'lf')
        }
      }]
    }]
  }
}
