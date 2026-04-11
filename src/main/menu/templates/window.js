import { Menu } from 'electron'
import { minimizeWindow, toggleAlwaysOnTop, toggleFullScreen } from '../actions/window'
import { zoomIn, zoomOut } from '../../windows/utils'
import { isOsx } from '../../config'

export default function (keybindings, i18n) {
  const menu = {
    label: (i18n && i18n.menu && i18n.menu.window && i18n.menu.window.label) || '&Window',
    role: 'window',
    submenu: [{
      label: (i18n && i18n.menu && i18n.menu.window && i18n.menu.window.minimize) || 'Minimize',
      accelerator: keybindings.getAccelerator('window.minimize'),
      click (menuItem, browserWindow) {
        minimizeWindow(browserWindow)
      }
    }, {
      id: 'alwaysOnTopMenuItem',
      label: (i18n && i18n.menu && i18n.menu.window && i18n.menu.window.alwaysOnTop) || 'Always on Top',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('window.toggle-always-on-top'),
      click (menuItem, browserWindow) {
        toggleAlwaysOnTop(browserWindow)
      }
    }, {
      type: 'separator'
    }, {
      label: (i18n && i18n.menu && i18n.menu.window && i18n.menu.window.zoomIn) || 'Zoom In',
      accelerator: keybindings.getAccelerator('window.zoom-in'),
      click (menuItem, browserWindow) {
        zoomIn(browserWindow)
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.window && i18n.menu.window.zoomOut) || 'Zoom Out',
      accelerator: keybindings.getAccelerator('window.zoom-out'),
      click (menuItem, browserWindow) {
        zoomOut(browserWindow)
      }
    }, {
      type: 'separator'
    }, {
      label: (i18n && i18n.menu && i18n.menu.window && i18n.menu.window.fullscreen) || 'Show in Full Screen',
      accelerator: keybindings.getAccelerator('window.toggle-full-screen'),
      click (item, browserWindow) {
        if (browserWindow) {
          toggleFullScreen(browserWindow)
        }
      }
    }]
  }

  if (isOsx) {
    menu.submenu.push({
      label: 'Bring All to Front',
      click () {
        Menu.sendActionToFirstResponder('arrangeInFront:')
      }
    })
  }
  return menu
}
