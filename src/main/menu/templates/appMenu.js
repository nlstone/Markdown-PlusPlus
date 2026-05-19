import { app } from 'electron'
import { showAboutDialog } from '../actions/help'
import * as actions from '../actions/app'

// macOS only menu.

export default function (keybindings, i18n) {
  return {
    label: (i18n && i18n.menu && i18n.menu.appMenu && i18n.menu.appMenu.label) || 'MarkDown++',
    submenu: [{
      label: (i18n && i18n.menu && i18n.menu.appMenu && i18n.menu.appMenu.about) || 'About MarkDown++',
      click (menuItem, focusedWindow) {
        showAboutDialog(focusedWindow)
      }
    }, {
      label: 'Check for updates...',
      click (menuItem, focusedWindow) {
        actions.checkUpdates(focusedWindow)
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.appMenu && i18n.menu.appMenu.preferences) || 'Preferences...',
      accelerator: keybindings.getAccelerator('file.preferences'),
      click () {
        actions.userSetting()
      }
    }, {
      type: 'separator'
    }, {
      label: (i18n && i18n.menu && i18n.menu.appMenu && i18n.menu.appMenu.services) || 'Services',
      role: 'services',
      submenu: []
    }, {
      type: 'separator'
    }, {
      label: (i18n && i18n.menu && i18n.menu.appMenu && i18n.menu.appMenu.hide) || 'Hide MarkDown++',
      accelerator: keybindings.getAccelerator('mt.hide'),
      click () {
        actions.osxHide()
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.appMenu && i18n.menu.appMenu.hideOthers) || 'Hide Others',
      accelerator: keybindings.getAccelerator('mt.hide-others'),
      click () {
        actions.osxHideAll()
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.appMenu && i18n.menu.appMenu.showAll) || 'Show All',
      click () {
        actions.osxShowAll()
      }
    }, {
      type: 'separator'
    }, {
      label: (i18n && i18n.menu && i18n.menu.appMenu && i18n.menu.appMenu.quit) || 'Quit MarkDown++',
      accelerator: keybindings.getAccelerator('file.quit'),
      click: app.quit
    }]
  }
}
