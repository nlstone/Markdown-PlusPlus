import { ipcRenderer } from 'electron'
import bus from '../bus'

// File operations that open dialogs in main process (renderer → main via send)
export const openFile = () => ipcRenderer.send('mt::cmd-open-file')
export const openFolder = () => ipcRenderer.send('mt::cmd-open-folder')

// File operations handled by renderer-side listeners (trigger via emit)
export const newTab = () => ipcRenderer.emit('mt::new-untitled-tab', null)
export const save = () => ipcRenderer.emit('mt::editor-ask-file-save', null)
export const saveAs = () => ipcRenderer.emit('mt::editor-ask-file-save-as', null)

// Command palette is a renderer-side listener (preferences.js:145) triggered via emit
export const showCommandPalette = () => ipcRenderer.emit('mt::show-command-palette', null)

// View operations (bus events)
export const toggleSourceCode = () => bus.$emit('view:toggle-view-entry', 'sourceCode')
export const toggleTypewriter = () => bus.$emit('view:toggle-view-entry', 'typewriter')
export const toggleFocus = () => bus.$emit('view:toggle-view-entry', 'focus')
export const toggleSidebar = () => bus.$emit('view:toggle-layout-entry', 'showSideBar')
export const toggleTabBar = () => bus.$emit('view:toggle-layout-entry', 'showTabBar')
