import * as actions from '../actions/view'

export default function (keybindings, i18n) {
  const viewMenu = {
    label: (i18n && i18n.menu && i18n.menu.view && i18n.menu.view.label) || '&View',
    submenu: [{
      label: (i18n && i18n.menu && i18n.menu.view && i18n.menu.view.commandPalette) || 'Command Palette...',
      accelerator: keybindings.getAccelerator('view.command-palette'),
      click (menuItem, focusedWindow) {
        actions.showCommandPalette(focusedWindow)
      }
    }, {
      type: 'separator'
    }, {
      id: 'sourceCodeModeMenuItem',
      label: (i18n && i18n.menu && i18n.menu.view && i18n.menu.view.sourceCodeMode) || 'Source Code Mode',
      accelerator: keybindings.getAccelerator('view.source-code-mode'),
      type: 'checkbox',
      checked: false,
      visible: false,
      click (item, focusedWindow) {
        actions.toggleSourceCodeMode(focusedWindow)
      }
    }, {
      id: 'typewriterModeMenuItem',
      label: (i18n && i18n.menu && i18n.menu.view && i18n.menu.view.typewriterMode) || 'Typewriter Mode',
      accelerator: keybindings.getAccelerator('view.typewriter-mode'),
      type: 'checkbox',
      checked: false,
      click (item, focusedWindow) {
        actions.toggleTypewriterMode(focusedWindow)
      }
    }, {
      id: 'focusModeMenuItem',
      label: (i18n && i18n.menu && i18n.menu.view && i18n.menu.view.focusMode) || 'Focus Mode',
      accelerator: keybindings.getAccelerator('view.focus-mode'),
      type: 'checkbox',
      checked: false,
      click (item, focusedWindow) {
        actions.toggleFocusMode(focusedWindow)
      }
    }, {
      type: 'separator'
    }, {
      label: (i18n && i18n.menu && i18n.menu.view && i18n.menu.view.showSidebar) || 'Show Sidebar',
      id: 'sideBarMenuItem',
      accelerator: keybindings.getAccelerator('view.toggle-sidebar'),
      type: 'checkbox',
      checked: false,
      click (item, focusedWindow) {
        actions.toggleSidebar(focusedWindow)
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.view && i18n.menu.view.showTabBar) || 'Show Tab Bar',
      id: 'tabBarMenuItem',
      accelerator: keybindings.getAccelerator('view.toggle-tabbar'),
      type: 'checkbox',
      checked: false,
      click (item, focusedWindow) {
        actions.toggleTabBar(focusedWindow)
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.view && i18n.menu.view.showToolbar) || 'Show Toolbar',
      id: 'toolbarMenuItem',
      type: 'checkbox',
      checked: true,
      click (item, focusedWindow) {
        actions.toggleToolbar(focusedWindow)
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.view && i18n.menu.view.toggleToc) || 'Toggle Table of Contents',
      id: 'tocMenuItem',
      accelerator: keybindings.getAccelerator('view.toggle-toc'),
      click (_, focusedWindow) {
        actions.showTableOfContents(focusedWindow)
      }
    }, {
      label: (i18n && i18n.menu && i18n.menu.view && i18n.menu.view.reloadImages) || 'Reload Images',
      accelerator: keybindings.getAccelerator('view.reload-images'),
      click (item, focusedWindow) {
        actions.reloadImageCache(focusedWindow)
      }
    }]
  }

  if (global.MARKDOWNPP_DEBUG) {
    viewMenu.submenu.push({
      type: 'separator'
    })
    viewMenu.submenu.push({
      label: 'Show Developer Tools',
      accelerator: keybindings.getAccelerator('view.toggle-dev-tools'),
      click (item, win) {
        actions.debugToggleDevTools(win)
      }
    })
    viewMenu.submenu.push({
      label: 'Reload window',
      accelerator: keybindings.getAccelerator('view.dev-reload'),
      click (item, focusedWindow) {
        actions.debugReloadWindow(focusedWindow)
      }
    })
  }

  return viewMenu
}
