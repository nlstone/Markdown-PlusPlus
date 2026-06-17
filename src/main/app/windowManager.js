import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import EventEmitter from 'events'
import log from 'electron-log'
import path from 'path'
import fs from 'fs'
import Watcher, { WATCHER_STABILITY_THRESHOLD, WATCHER_STABILITY_POLL_INTERVAL } from '../filesystem/watcher'
import { WindowType } from '../windows/base'

function getWikiVersions (wikiRootPath) {
  if (!fs.existsSync(wikiRootPath)) return []

  return fs.readdirSync(wikiRootPath, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const versionPath = entry.name
      const wikiJsonPath = path.join(wikiRootPath, versionPath, 'wiki.json')
      if (!fs.existsSync(wikiJsonPath)) return null

      try {
        const wikiData = JSON.parse(fs.readFileSync(wikiJsonPath, 'utf-8'))
        return {
          versionPath,
          title: wikiData.title || versionPath,
          pageCount: Array.isArray(wikiData.pages) ? wikiData.pages.length : 0
        }
      } catch (err) {
        log.warn(`Failed to read wiki version ${wikiJsonPath}:`, err)
        return {
          versionPath,
          title: versionPath,
          pageCount: 0
        }
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.versionPath.localeCompare(a.versionPath))
}

function readWikiCurrentVersion (wikiRootPath) {
  const currentPath = path.join(wikiRootPath, 'current')
  if (!fs.existsSync(currentPath)) return ''
  return fs.readFileSync(currentPath, 'utf-8').trim()
}

class WindowActivityList {
  constructor () {
    // Oldest             Newest
    //  <number>, ... , <number>
    this._buf = []
  }

  getNewest () {
    const { _buf } = this
    if (_buf.length) {
      return _buf[_buf.length - 1]
    }
    return null
  }

  getSecondNewest () {
    const { _buf } = this
    if (_buf.length >= 2) {
      return _buf[_buf.length - 2]
    }
    return null
  }

  setNewest (id) {
    // I think we do not need a linked list for only a few windows.
    const { _buf } = this
    const index = _buf.indexOf(id)
    if (index !== -1) {
      const lastIndex = _buf.length - 1
      if (index === lastIndex) {
        return
      }
      _buf.splice(index, 1)
    }
    _buf.push(id)
  }

  delete (id) {
    const { _buf } = this
    const index = _buf.indexOf(id)
    if (index !== -1) {
      _buf.splice(index, 1)
    }
  }
}

class WindowManager extends EventEmitter {
  /**
   *
   * @param {AppMenu} appMenu The application menu instance.
   * @param {Preference} preferences The preference instance.
   */
  constructor (appMenu, preferences) {
    super()

    this._appMenu = appMenu

    this._activeWindowId = null
    this._windows = new Map()
    this._windowActivity = new WindowActivityList()

    // TODO(need::refactor): Please see #1035.
    this._watcher = new Watcher(preferences)

    this._listenForIpcMain()
  }

  /**
   * Add the given window to the window list.
   *
   * @param {IApplicationWindow} window The application window. We take ownership!
   */
  add (window) {
    const { id: windowId } = window
    this._windows.set(windowId, window)

    if (!this._appMenu.has(windowId)) {
      this._appMenu.addDefaultMenu(windowId)
    }

    if (this.windowCount === 1) {
      this.setActiveWindow(windowId)
    }

    window.on('window-focus', () => {
      this.setActiveWindow(windowId)
    })
    window.on('window-closed', () => {
      this.remove(windowId)
      this._watcher.unwatchByWindowId(windowId)
    })
  }

  /**
   * Return the application window by id.
   *
   * @param {string} windowId The window id.
   * @returns {BaseWindow} The application window or undefined.
   */
  get (windowId) {
    return this._windows.get(windowId)
  }

  /**
   * Return the BrowserWindow by id.
   *
   * @param {string} windowId The window id.
   * @returns {Electron.BrowserWindow} The window or undefined.
   */
  getBrowserWindow (windowId) {
    const window = this.get(windowId)
    if (window) {
      return window.browserWindow
    }
    return undefined
  }

  /**
   * Remove the given window by id.
   *
   * NOTE: All window "window-focus" events listeners are removed!
   *
   * @param {string} windowId The window id.
   * @returns {IApplicationWindow} Returns the application window. We no longer take ownership.
   */
  remove (windowId) {
    const { _windows } = this
    const window = this.get(windowId)
    if (window) {
      window.removeAllListeners('window-focus')

      this._windowActivity.delete(windowId)
      const nextWindowId = this._windowActivity.getNewest()
      this.setActiveWindow(nextWindowId)

      _windows.delete(windowId)
    }
    return window
  }

  setActiveWindow (windowId) {
    if (this._activeWindowId !== windowId) {
      this._activeWindowId = windowId
      this._windowActivity.setNewest(windowId)
      if (windowId != null) {
        // windowId is null when all windows are closed (e.g. when gracefully closed).
        this._appMenu.setActiveWindow(windowId)
      }
      this.emit('activeWindowChanged', windowId)
    }
  }

  /**
   * Returns the active window or null if no window is registered.
   * @returns {BaseWindow|undefined}
   */
  getActiveWindow () {
    return this._windows.get(this._activeWindowId)
  }

  /**
   * Returns the active window id or null if no window is registered.
   * @returns {number|null}
   */
  getActiveWindowId () {
    return this._activeWindowId
  }

  /**
   * Returns the (last) active editor window or null if no editor is registered.
   * @returns {EditorWindow|undefined}
   */
  getActiveEditor () {
    let win = this.getActiveWindow()
    if (win && win.type !== WindowType.EDITOR) {
      win = this._windows.get(this._windowActivity.getSecondNewest())
      if (win && win.type === WindowType.EDITOR) {
        return win
      }
      return undefined
    }
    return win
  }

  /**
   * Returns the (last) active editor window id or null if no editor is registered.
   * @returns {number|null}
   */
  getActiveEditorId () {
    const win = this.getActiveEditor()
    return win ? win.id : null
  }

  /**
   *
   * @param {WindowType} type the WindowType one of ['base', 'editor', 'settings']
   * @returns {{id: number, win: BaseWindow}[]} Return the windows of the given {type}
   */
  getWindowsByType (type) {
    if (!WindowType[type.toUpperCase()]) {
      console.error(`"${type}" is not a valid window type.`)
    }
    const { windows } = this
    const result = []
    for (const [key, value] of windows) {
      if (value.type === type) {
        result.push({
          id: key,
          win: value
        })
      }
    }
    return result
  }

  /**
   * Find the best window to open the files in.
   *
   * @param {string[]} fileList File full paths.
   * @returns {{windowId: string, fileList: string[]}[]} An array of files mapped to a window id or null to open in a new window.
   */
  findBestWindowToOpenIn (fileList) {
    if (!fileList || !Array.isArray(fileList) || !fileList.length) return []
    const { windows } = this
    const lastActiveEditorId = this.getActiveEditorId() // editor id or null

    if (this.windowCount <= 1) {
      return [{ windowId: lastActiveEditorId, fileList }]
    }

    // Array of scores, same order like fileList.
    let filePathScores = null
    for (const window of windows.values()) {
      if (window.type === WindowType.EDITOR) {
        const scores = window.getCandidateScores(fileList)
        if (!filePathScores) {
          filePathScores = scores
        } else {
          const len = filePathScores.length
          for (let i = 0; i < len; ++i) {
            // Update score only if the file is not already opened.
            if (filePathScores[i].score !== -1 && filePathScores[i].score < scores[i].score) {
              filePathScores[i] = scores[i]
            }
          }
        }
      }
    }

    const buf = []
    const len = filePathScores.length
    for (let i = 0; i < len; ++i) {
      let { id: windowId, score } = filePathScores[i]

      if (score === -1) {
        // Skip files that already opened.
        continue
      } else if (score === 0) {
        // There is no best window to open the file(s) in.
        windowId = lastActiveEditorId
      }

      let item = buf.find(w => w.windowId === windowId)
      if (!item) {
        item = { windowId, fileList: [] }
        buf.push(item)
      }
      item.fileList.push(fileList[i])
    }
    return buf
  }

  get windows () {
    return this._windows
  }

  get windowCount () {
    return this._windows.size
  }

  // --- helper ---------------------------------

  closeWatcher () {
    this._watcher.close()
  }

  /**
   * Closes the browser window and associated application window without asking to save documents.
   *
   * @param {Electron.BrowserWindow} browserWindow The browser window.
   */
  forceClose (browserWindow) {
    if (!browserWindow) {
      return false
    }

    const { id: windowId } = browserWindow
    const { _appMenu, _windows } = this

    // Free watchers used by this window
    this._watcher.unwatchByWindowId(windowId)

    // Application clearup and remove listeners
    _appMenu.removeWindowMenu(windowId)
    const window = this.remove(windowId)

    // Destroy window wrapper and browser window
    if (window) {
      window.destroy()
    } else {
      log.error('Something went wrong: Cannot find associated application window!')
      browserWindow.destroy()
    }

    // Quit application on macOS if not windows are opened.
    if (_windows.size === 0) {
      app.quit()
    }
    return true
  }

  /**
   * Closes the application window and associated browser window without asking to save documents.
   *
   * @param {number} windowId The application window or browser window id.
   */
  forceCloseById (windowId) {
    const browserWindow = this.getBrowserWindow(windowId)
    if (browserWindow) {
      return this.forceClose(browserWindow)
    }
    return false
  }

  // --- private --------------------------------

  _listenForIpcMain () {
    // HACK: Don't use this event! Please see #1034 and #1035
    ipcMain.on('mt::window-add-file-path', (e, filePath) => {
      const win = BrowserWindow.fromWebContents(e.sender)
      const editor = this.get(win.id)
      if (!editor) {
        log.error(`Cannot find window id "${win.id}" to add opened file.`)
        return
      }
      editor.addToOpenedFiles(filePath)
    })

    // Force close a BrowserWindow
    ipcMain.on('mt::close-window', e => {
      const win = BrowserWindow.fromWebContents(e.sender)
      this.forceClose(win)
    })

    ipcMain.on('mt::open-file', (e, filePath, options) => {
      const win = BrowserWindow.fromWebContents(e.sender)
      const editor = this.get(win.id)
      if (!editor) {
        log.error(`Cannot find window id "${win.id}" to open file.`)
        return
      }
      editor.openTab(filePath, options, true)
    })

    ipcMain.on('mt::window-tab-closed', (e, pathname) => {
      const win = BrowserWindow.fromWebContents(e.sender)
      const editor = this.get(win.id)
      if (editor) {
        editor.removeFromOpenedFiles(pathname)
      }
    })

    ipcMain.on('mt::window-toggle-always-on-top', e => {
      const win = BrowserWindow.fromWebContents(e.sender)
      const flag = !win.isAlwaysOnTop()
      win.setAlwaysOnTop(flag)
      this._appMenu.updateAlwaysOnTopMenu(win.id, flag)
    })

    // --- local events ---------------

    ipcMain.on('watcher-unwatch-all-by-id', windowId => {
      this._watcher.unwatchByWindowId(windowId)
    })
    ipcMain.on('watcher-watch-file', (win, filePath) => {
      this._watcher.watch(win, filePath, 'file')
    })
    ipcMain.on('watcher-watch-directory', (win, pathname) => {
      this._watcher.watch(win, pathname, 'dir')
    })
    ipcMain.on('watcher-unwatch-file', (win, filePath) => {
      this._watcher.unwatch(win, filePath, 'file')
    })
    ipcMain.on('watcher-unwatch-directory', (win, pathname) => {
      this._watcher.unwatch(win, pathname, 'dir')
    })

    ipcMain.on('window-add-file-path', (windowId, filePath) => {
      const editor = this.get(windowId)
      if (!editor) {
        log.error(`Cannot find window id "${windowId}" to add opened file.`)
        return
      }
      editor.addToOpenedFiles(filePath)
    })
    ipcMain.on('window-change-file-path', (windowId, pathname, oldPathname) => {
      const editor = this.get(windowId)
      if (!editor) {
        log.error(`Cannot find window id "${windowId}" to change file path.`)
        return
      }
      editor.changeOpenedFilePath(pathname, oldPathname)
    })

    ipcMain.on('window-file-saved', (windowId, pathname) => {
      // A changed event is emitted earliest after the stability threshold.
      const duration = WATCHER_STABILITY_THRESHOLD + (WATCHER_STABILITY_POLL_INTERVAL * 2)
      this._watcher.ignoreChangedEvent(windowId, pathname, duration)
    })

    ipcMain.on('window-close-by-id', id => {
      this.forceCloseById(id)
    })
    ipcMain.on('window-reload-by-id', id => {
      const window = this.get(id)
      if (window) {
        window.reload()
      }
    })
    ipcMain.on('window-toggle-always-on-top', win => {
      const flag = !win.isAlwaysOnTop()
      win.setAlwaysOnTop(flag)
      this._appMenu.updateAlwaysOnTopMenu(win.id, flag)
    })

    // ZRead documentation structure detection and loading
    ipcMain.on('mt::check-zread', async (e, payload) => {
      const win = BrowserWindow.fromWebContents(e.sender)
      if (!win) return

      try {
        const rootPath = typeof payload === 'string' ? payload : payload?.rootPath
        const requestedVersionPath = typeof payload === 'object' ? payload?.versionPath : null
        const wikiRootPath = path.join(rootPath, '.zread', 'wiki')

        if (!rootPath || !fs.existsSync(wikiRootPath)) {
          e.sender.send('mt::zread-result', { hasZread: false })
          return
        }

        const currentVersionPath = readWikiCurrentVersion(wikiRootPath)
        const versions = getWikiVersions(wikiRootPath)
        const versionPath = requestedVersionPath || currentVersionPath || versions[0]?.versionPath

        if (!versionPath) {
          e.sender.send('mt::zread-result', { hasZread: false })
          return
        }

        // Read wiki.json
        const wikiJsonPath = path.join(rootPath, '.zread', 'wiki', versionPath, 'wiki.json')
        if (!fs.existsSync(wikiJsonPath)) {
          e.sender.send('mt::zread-error', { message: 'wiki.json not found' })
          return
        }

        const wikiContent = fs.readFileSync(wikiJsonPath, 'utf-8')
        const wikiData = JSON.parse(wikiContent)

        e.sender.send('mt::zread-result', {
          hasZread: true,
          rootPath,
          versionPath,
          currentVersionPath,
          versions,
          pages: wikiData.pages || []
        })
      } catch (err) {
        log.error('ZRead check error:', err)
        e.sender.send('mt::zread-error', { message: err.message })
      }
    })

    // .md++ wiki detection (same format as zread)
    ipcMain.on('mt::check-wiki', async (e, payload) => {
      const win = BrowserWindow.fromWebContents(e.sender)
      if (!win) return

      try {
        const rootPath = typeof payload === 'string' ? payload : payload?.rootPath
        const requestedVersionPath = typeof payload === 'object' ? payload?.versionPath : null
        const wikiRootPath = path.join(rootPath, '.md++', 'wiki')

        if (!rootPath || !fs.existsSync(wikiRootPath)) {
          e.sender.send('mt::wiki-result', { hasWiki: false })
          return
        }

        const currentVersionPath = readWikiCurrentVersion(wikiRootPath)
        const versions = getWikiVersions(wikiRootPath)
        const versionPath = requestedVersionPath || currentVersionPath || versions[0]?.versionPath

        if (!versionPath) {
          e.sender.send('mt::wiki-result', { hasWiki: false })
          return
        }

        const wikiJsonPath = path.join(rootPath, '.md++', 'wiki', versionPath, 'wiki.json')
        if (!fs.existsSync(wikiJsonPath)) {
          e.sender.send('mt::wiki-error', { message: 'wiki.json not found' })
          return
        }

        const wikiContent = fs.readFileSync(wikiJsonPath, 'utf-8')
        const wikiData = JSON.parse(wikiContent)

        e.sender.send('mt::wiki-result', {
          hasWiki: true,
          rootPath,
          versionPath,
          currentVersionPath,
          versions,
          pages: wikiData.pages || []
        })
      } catch (err) {
        log.error('Wiki check error:', err)
        e.sender.send('mt::wiki-error', { message: err.message })
      }
    })

    // Wiki file tree reading — scan a local directory and return file tree + README
    ipcMain.on('mt::wiki-read-file-tree', async (e, rootPath) => {
      const win = BrowserWindow.fromWebContents(e.sender)
      if (!win) return

      try {
        if (!rootPath || !fs.existsSync(rootPath) || !fs.statSync(rootPath).isDirectory()) {
          e.sender.send('mt::wiki-file-tree-error', { message: 'Invalid directory path' })
          return
        }

        const EXCLUDED_DIRS = new Set([
          'node_modules', '.git', '.svn', '.hg',
          'dist', 'build', 'out', 'target', 'bin', 'obj',
          '.idea', '.vscode', '.vs',
          '__pycache__', '.pytest_cache', '.mypy_cache',
          '.venv', 'venv', 'env',
          '.md++', '.zread'
        ])

        const EXCLUDED_FILES = new Set([
          'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
          'poetry.lock', 'Cargo.lock', 'composer.lock',
          '.DS_Store', 'Thumbs.db'
        ])

        const fileTreeLines = []
        let readmeContent = ''

        const walk = (dir, prefix) => {
          let entries
          try {
            entries = fs.readdirSync(dir, { withFileTypes: true })
          } catch (_) { return }

          // Sort: directories first, then files
          entries.sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory()) return -1
            if (!a.isDirectory() && b.isDirectory()) return 1
            return a.name.localeCompare(b.name)
          })

          for (const entry of entries) {
            if (entry.name.startsWith('.') && entry.name !== '.') continue
            if (EXCLUDED_DIRS.has(entry.name)) continue
            if (entry.isFile() && EXCLUDED_FILES.has(entry.name)) continue

            const relPath = prefix ? `${prefix}/${entry.name}` : entry.name

            if (entry.isDirectory()) {
              walk(path.join(dir, entry.name), relPath)
            } else {
              fileTreeLines.push(relPath)
              // Capture README
              if (!readmeContent && entry.name.toLowerCase() === 'readme.md') {
                try {
                  readmeContent = fs.readFileSync(path.join(dir, entry.name), 'utf-8')
                } catch (_) {}
              }
            }
          }
        }

        walk(rootPath, '')

        e.sender.send('mt::wiki-file-tree-result', {
          fileTree: fileTreeLines.join('\n'),
          readme: readmeContent
        })
      } catch (err) {
        log.error('Wiki file tree read error:', err)
        e.sender.send('mt::wiki-file-tree-error', { message: err.message })
      }
    })

    // Wiki save — write generated wiki data to .md++/ directory
    ipcMain.on('mt::wiki-save', async (e, { rootPath, wikiJson, pages }) => {
      const win = BrowserWindow.fromWebContents(e.sender)
      if (!win) return

      try {
        if (!rootPath || !fs.existsSync(rootPath)) {
          e.sender.send('mt::wiki-save-error', { message: 'Invalid root path' })
          return
        }

        const wikiDir = path.join(rootPath, '.md++', 'wiki')
        const versionId = wikiJson.id || new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
        const versionDir = path.join(wikiDir, 'versions', versionId)

        // Create directory structure
        fs.mkdirSync(versionDir, { recursive: true })

        // Write wiki.json
        fs.writeFileSync(
          path.join(versionDir, 'wiki.json'),
          JSON.stringify(wikiJson, null, 2),
          'utf-8'
        )

        // Write each page
        for (const page of pages) {
          fs.writeFileSync(
            path.join(versionDir, page.filename),
            page.content,
            'utf-8'
          )
        }

        // Update current pointer
        fs.writeFileSync(
          path.join(wikiDir, 'current'),
          `versions/${versionId}`,
          'utf-8'
        )

        e.sender.send('mt::wiki-save-result', { success: true, versionId })
      } catch (err) {
        log.error('Wiki save error:', err)
        e.sender.send('mt::wiki-save-error', { message: err.message })
      }
    })

    // Wiki file content reading — read specific files from a directory
    ipcMain.on('mt::wiki-read-files', async (e, { rootPath, filePaths, maxLines }) => {
      const win = BrowserWindow.fromWebContents(e.sender)
      if (!win) return

      try {
        if (!rootPath || !fs.existsSync(rootPath)) {
          e.sender.send('mt::wiki-read-files-error', { message: 'Invalid root path' })
          return
        }

        const results = {}
        const linesPerFile = maxLines || 100

        for (const relPath of filePaths) {
          const fullPath = path.join(rootPath, relPath)
          try {
            if (!fs.existsSync(fullPath)) {
              results[relPath] = { error: 'File not found' }
              continue
            }

            const content = fs.readFileSync(fullPath, 'utf-8')
            const lines = content.split('\n')

            // For small files (<500 lines), read all; for large files, read first N lines
            if (lines.length <= 500) {
              results[relPath] = {
                content: content,
                lines: lines.length,
                truncated: false
              }
            } else {
              results[relPath] = {
                content: lines.slice(0, linesPerFile).join('\n'),
                lines: lines.length,
                truncated: true
              }
            }
          } catch (err) {
            results[relPath] = { error: err.message }
          }
        }

        e.sender.send('mt::wiki-read-files-result', { files: results })
      } catch (err) {
        log.error('Wiki read files error:', err)
        e.sender.send('mt::wiki-read-files-error', { message: err.message })
      }
    })

    // Wiki export — save wiki as HTML or PDF
    ipcMain.on('mt::export-wiki', async (e, { type, content, title }) => {
      const win = BrowserWindow.fromWebContents(e.sender)
      if (!win) return

      const extension = type === 'pdf' ? '.pdf' : '.html'
      const filters = type === 'pdf'
        ? [{ name: 'PDF Document', extensions: ['pdf'] }]
        : [{ name: 'HTML Document', extensions: ['html'] }]

      const { filePath, canceled } = await dialog.showSaveDialog(win, {
        defaultPath: path.join(app.getPath('documents'), `${title || 'wiki'}${extension}`),
        filters
      })

      if (canceled || !filePath) {
        e.sender.send('mt::export-wiki-success', { type, canceled: true })
        return
      }

      if (filePath) {
        try {
          if (type === 'pdf') {
            // Write HTML to temp file, open in hidden window, print to PDF
            const tmpPath = filePath + '.tmp.html'
            fs.writeFileSync(tmpPath, content, 'utf-8')

            const pdfWin = new BrowserWindow({
              show: false,
              webPreferences: { nodeIntegration: false }
            })

            pdfWin.loadFile(tmpPath)

            pdfWin.webContents.on('did-finish-load', async () => {
              // Wait for mermaid to render
              await new Promise(resolve => setTimeout(resolve, 3000))
              try {
                const data = await pdfWin.webContents.printToPDF({
                  printBackground: true,
                  pageSize: 'A4',
                  margins: { top: 0, bottom: 0, left: 0, right: 0 }
                })
                fs.writeFileSync(filePath, data)
                e.sender.send('mt::export-wiki-success', { type: 'pdf', filePath })
              } catch (pdfErr) {
                log.error('PDF generation error:', pdfErr)
                e.sender.send('mt::export-wiki-error', { message: pdfErr.message })
              } finally {
                pdfWin.close()
                try { fs.unlinkSync(tmpPath) } catch (_) {}
              }
            })
          } else {
            fs.writeFileSync(filePath, content, 'utf-8')
            e.sender.send('mt::export-wiki-success', { type: 'html', filePath })
          }
        } catch (err) {
          log.error('Wiki export error:', err)
          e.sender.send('mt::export-wiki-error', { message: err.message })
        }
      }
    })

    ipcMain.on('broadcast-preferences-changed', prefs => {
      // We can not dynamic change the title bar style, so do not need to send it to renderer.
      if (typeof prefs.titleBarStyle !== 'undefined') {
        delete prefs.titleBarStyle
      }
      if (Object.keys(prefs).length > 0) {
        for (const { browserWindow } of this._windows.values()) {
          browserWindow.webContents.send('mt::user-preference', prefs)
        }
      }
    })

    ipcMain.on('broadcast-user-data-changed', userData => {
      for (const { browserWindow } of this._windows.values()) {
        browserWindow.webContents.send('mt::user-preference', userData)
      }
    })
  }
}

export default WindowManager
