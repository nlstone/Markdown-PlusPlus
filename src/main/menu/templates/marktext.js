import { app } from 'electron'
import { showAboutDialog } from '../actions/help'
import * as actions from '../actions/marktext'

// macOS only menu.

export default function (keybindings, i18n) {
  return {
    label: (i18n && i18n.menu && i18n.menu.marktext && i18n.menu.marktext.label) || 'MarkDown++',
    submenu: [{
      label: (i18n && i18n.menu && i18n.menu.marktext && i18n.menu.marktext.about) || 'About MarkDown++',
      click (menuItem, focusedWindow) {
        showAboutDialog(focusedWindow)
      }
    }, {
      label: 'Check for updates...',
      click (menuItem, focusedWindow) {
        actions.checkUpdates(focusedWindow)
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.marktext && i18n.menu.marktext.preferences) || 'Preferences...',
      accelerator: keybindings.getAccelerator('file.preferences'),
      click () {
        actions.userSetting()
      }
    }, {
      type: 'separator'
    }, {
      label: (i18n && i18n.menu && i18n.menu.marktext && i18n.menu.marktext.services) || 'Services',
      role: 'services',
      submenu: []
    }, {
      type: 'separator'
    }, {
      label: (i18n && i18n.menu && i18n.menu.marktext && i18n.menu.marktext.hide) || 'Hide MarkDown++',
      accelerator: keybindings.getAccelerator('mt.hide'),
      click () {
        actions.osxHide()
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.marktext && i18n.menu.marktext.hideOthers) || 'Hide Others',
      accelerator: keybindings.getAccelerator('mt.hide-others'),
      click () {
        actions.osxHideAll()
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.marktext && i18n.menu.marktext.showAll) || 'Show All',
      click () {
        actions.osxShowAll()
      }
    }, {
      type: 'separator'
    }, {
      label: (i18n && i18n.menu && i18n.menu.marktext && i18n.menu.marktext.quit) || 'Quit MarkDown++',
      accelerator: keybindings.getAccelerator('file.quit'),
      click: app.quit
    }]
  }
}
