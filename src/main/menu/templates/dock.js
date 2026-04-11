import { app, Menu } from 'electron'
import * as actions from '../actions/file'

export default function (i18n) {
  const dockMenu = Menu.buildFromTemplate([{
    label: (i18n && i18n.menu && i18n.menu.file && i18n.menu.file.openFile) || 'Open...',
    click (menuItem, browserWindow) {
      if (browserWindow) {
        actions.openFile(browserWindow)
      } else {
        actions.newEditorWindow()
      }
    }
  }, {
    label: (i18n && i18n.menu && i18n.menu.file && i18n.menu.file.clearRecentlyUsed) || 'Clear Recent',
    click () {
      app.clearRecentDocuments()
    }
  }])
  return dockMenu
}
