import { app } from 'electron'
import * as actions from '../actions/file'
import { userSetting } from '../actions/marktext'
import { isOsx } from '../../config'

export default function (keybindings, userPreference, recentlyUsedFiles, i18n) {
  const { autoSave } = userPreference.getAll()
  const fileMenu = {
    label: (i18n && i18n.menu && i18n.menu.file && i18n.menu.file.label) || '&File',
    submenu: [{
      label: (i18n && i18n.menu && i18n.menu.file && i18n.menu.file.newTab) || 'New Tab',
      accelerator: keybindings.getAccelerator('file.new-tab'),
      click (menuItem, browserWindow) {
        actions.newBlankTab(browserWindow)
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.file && i18n.menu.file.newWindow) || 'New Window',
      accelerator: keybindings.getAccelerator('file.new-window'),
      click (menuItem, browserWindow) {
        actions.newEditorWindow()
      }
    }, {
      type: 'separator'
    }, {
      label: (i18n && i18n.menu && i18n.menu.file && i18n.menu.file.openFile) || 'Open File...',
      accelerator: keybindings.getAccelerator('file.open-file'),
      click (menuItem, browserWindow) {
        actions.openFile(browserWindow)
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.file && i18n.menu.file.openFolder) || 'Open Folder...',
      accelerator: keybindings.getAccelerator('file.open-folder'),
      click (menuItem, browserWindow) {
        actions.openFolder(browserWindow)
      }
    }]
  }

  if (!isOsx) {
    const recentlyUsedMenu = {
      label: (i18n && i18n.menu && i18n.menu.file && i18n.menu.file.openRecent) || 'Open Recent',
      submenu: []
    }

    for (const item of recentlyUsedFiles) {
      recentlyUsedMenu.submenu.push({
        label: item,
        click (menuItem, browserWindow) {
          actions.openFileOrFolder(browserWindow, menuItem.label)
        }
      })
    }

    recentlyUsedMenu.submenu.push({
      type: 'separator',
      visible: recentlyUsedFiles.length > 0
    }, {
      label: (i18n && i18n.menu && i18n.menu.file && i18n.menu.file.clearRecentlyUsed) || 'Clear Recently Used',
      enabled: recentlyUsedFiles.length > 0,
      click (menuItem, browserWindow) {
        actions.clearRecentlyUsed()
      }
    })
    fileMenu.submenu.push(recentlyUsedMenu)
  } else {
    fileMenu.submenu.push({
      role: 'recentdocuments',
      submenu: [
        {
          role: 'clearrecentdocuments'
        }
      ]
    })
  }

  fileMenu.submenu.push({
    type: 'separator'
  }, {
    label: (i18n && i18n.menu && i18n.menu.file && i18n.menu.file.save) || 'Save',
    accelerator: keybindings.getAccelerator('file.save'),
    click (menuItem, browserWindow) {
      actions.save(browserWindow)
    }
  }, {
    label: (i18n && i18n.menu && i18n.menu.file && i18n.menu.file.saveAs) || 'Save As...',
    accelerator: keybindings.getAccelerator('file.save-as'),
    click (menuItem, browserWindow) {
      actions.saveAs(browserWindow)
    }
  }, {
    label: (i18n && i18n.menu && i18n.menu.file && i18n.menu.file.autoSave) || 'Auto Save',
    type: 'checkbox',
    checked: autoSave,
    id: 'autoSaveMenuItem',
    click (menuItem, browserWindow) {
      actions.autoSave(menuItem, browserWindow)
    }
  }, {
    type: 'separator'
  }, {
    label: (i18n && i18n.menu && i18n.menu.file && i18n.menu.file.moveTo) || 'Move To...',
    accelerator: keybindings.getAccelerator('file.move-file'),
    click (menuItem, browserWindow) {
      actions.moveTo(browserWindow)
    }
  }, {
    label: (i18n && i18n.menu && i18n.menu.file && i18n.menu.file.rename) || 'Rename...',
    accelerator: keybindings.getAccelerator('file.rename-file'),
    click (menuItem, browserWindow) {
      actions.rename(browserWindow)
    }
  }, {
    type: 'separator'
  }, {
    label: (i18n && i18n.menu && i18n.menu.file && i18n.menu.file.import) || 'Import...',
    click (menuItem, browserWindow) {
      actions.importFile(browserWindow)
    }
  }, {
    label: (i18n && i18n.menu && i18n.menu.file && i18n.menu.file.export) || 'Export',
    submenu: [
      {
        label: (i18n && i18n.menu && i18n.menu.file && i18n.menu.file.exportHtml) || 'HTML',
        click (menuItem, browserWindow) {
          actions.exportFile(browserWindow, 'styledHtml')
        }
      }, {
        label: (i18n && i18n.menu && i18n.menu.file && i18n.menu.file.exportPdf) || 'PDF',
        click (menuItem, browserWindow) {
          actions.exportFile(browserWindow, 'pdf')
        }
      }
    ]
  }, {
    label: (i18n && i18n.menu && i18n.menu.file && i18n.menu.file.print) || 'Print',
    accelerator: keybindings.getAccelerator('file.print'),
    click (menuItem, browserWindow) {
      actions.printDocument(browserWindow)
    }
  }, {
    type: 'separator',
    visible: !isOsx
  }, {
    label: (i18n && i18n.menu && i18n.menu.file && i18n.menu.file.preferences) || 'Preferences...',
    accelerator: keybindings.getAccelerator('file.preferences'),
    visible: !isOsx,
    click () {
      userSetting()
    }
  }, {
    type: 'separator'
  }, {
    label: (i18n && i18n.menu && i18n.menu.file && i18n.menu.file.closeTab) || 'Close Tab',
    accelerator: keybindings.getAccelerator('file.close-tab'),
    click (menuItem, browserWindow) {
      actions.closeTab(browserWindow)
    }
  }, {
    label: (i18n && i18n.menu && i18n.menu.file && i18n.menu.file.closeWindow) || 'Close Window',
    accelerator: keybindings.getAccelerator('file.close-window'),
    click (menuItem, browserWindow) {
      actions.closeWindow(browserWindow)
    }
  }, {
    type: 'separator',
    visible: !isOsx
  }, {
    label: (i18n && i18n.menu && i18n.menu.file && i18n.menu.file.quit) || 'Quit',
    accelerator: keybindings.getAccelerator('file.quit'),
    visible: !isOsx,
    click: app.quit
  })
  return fileMenu
}
