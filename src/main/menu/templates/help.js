import path from 'path'
import { shell } from 'electron'
import { isFile } from 'common/filesystem'
import * as actions from '../actions/help'
import { checkUpdates } from '../actions/marktext'

/// Check whether the package is updatable at runtime.
const isUpdatable = () => {
  // TODO: If not updatable, allow to check whether there is a new version available.

  const resFile = isFile(path.join(process.resourcesPath, 'app-update.yml'))
  if (!resFile) {
    // No update resource file available.
    return false
  } else if (process.env.APPIMAGE) {
    // We are running as AppImage.
    return true
  } else if (process.platform === 'win32' && isFile(path.join(process.resourcesPath, 'md.ico'))) {
    // Windows is a little but tricky. The update resource file is always available and
    // there is no way to check the target type at runtime (electron-builder#4119).
    // As workaround we check whether "md.ico" exists that is only included in the setup.
    return true
  }

  // Otherwise assume that we cannot perform an auto update (standalone binary, archives,
  // packed for package manager).
  return false
}

export default function (i18n) {
  const helpMenu = {
    label: (i18n && i18n.menu && i18n.menu.help && i18n.menu.help.label) || '&Help',
    role: 'help',
    submenu: [{
      label: (i18n && i18n.menu && i18n.menu.help && i18n.menu.help.quickStart) || 'Quick Start...',
      click () {
        shell.openExternal('https://github.com/marktext/marktext/blob/master/docs/README.md')
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.help && i18n.menu.help.markdownReference) || 'Markdown Reference...',
      click () {
        shell.openExternal('https://github.com/marktext/marktext/blob/master/docs/MARKDOWN_SYNTAX.md')
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.help && i18n.menu.help.changelog) || 'Changelog...',
      click () {
        shell.openExternal('https://github.com/marktext/marktext/blob/master/.github/CHANGELOG.md')
      }
    }, {
      type: 'separator'
    }, {
      label: (i18n && i18n.menu && i18n.menu.help && i18n.menu.help.donate) || 'Donate via Open Collective...',
      click (item, win) {
        shell.openExternal('https://opencollective.com/marktext')
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.help && i18n.menu.help.feedback) || 'Feedback via Twitter...',
      click (item, win) {
        actions.showTweetDialog(win, 'twitter')
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.help && i18n.menu.help.reportIssue) || 'Report Issue or Request Feature...',
      click () {
        shell.openExternal('https://github.com/marktext/marktext/issues')
      }
    }, {
      type: 'separator'
    }, {
      label: 'Website...',
      click () {
        shell.openExternal('https://github.com/marktext/marktext')
      }
    }, {
      label: 'Watch on GitHub...',
      click () {
        shell.openExternal('https://github.com/marktext/marktext')
      }
    }, {
      label: 'Follow us on Github...',
      click () {
        shell.openExternal('https://github.com/Jocs')
      }
    }, {
      label: 'Follow us on Twitter...',
      click () {
        shell.openExternal('https://twitter.com/marktextapp')
      }
    }, {
      type: 'separator'
    }, {
      label: 'License...',
      click () {
        shell.openExternal('https://github.com/marktext/marktext/blob/master/LICENSE')
      }
    }]
  }

  if (isUpdatable()) {
    helpMenu.submenu.push({
      type: 'separator'
    }, {
      label: 'Check for updates...',
      click (menuItem, browserWindow) {
        checkUpdates(browserWindow)
      }
    })
  }

  if (process.platform !== 'darwin') {
    helpMenu.submenu.push({
      type: 'separator'
    }, {
      label: (i18n && i18n.menu && i18n.menu.help && i18n.menu.help.about) || 'About NextReader...',
      click (menuItem, browserWindow) {
        actions.showAboutDialog(browserWindow)
      }
    })
  }
  return helpMenu
}
