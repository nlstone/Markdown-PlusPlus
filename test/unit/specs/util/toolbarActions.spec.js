import { ipcRenderer } from 'electron'
import bus from '@/renderer/bus'
import {
  newTab,
  openFile,
  openFolder,
  save,
  saveAs,
  showCommandPalette,
  toggleFocus,
  toggleSidebar,
  toggleSourceCode,
  toggleTabBar,
  toggleTypewriter,
} from '@/renderer/util/toolbarActions'

describe('toolbarActions', () => {
  let ipcSendCalls
  let ipcEmitCalls
  let busCalls
  let originalSend
  let originalIpcEmit
  let originalBusEmit

  beforeEach(() => {
    ipcSendCalls = []
    ipcEmitCalls = []
    busCalls = []

    originalSend = ipcRenderer.send
    ipcRenderer.send = (channel, ...args) => {
      ipcSendCalls.push({ channel, args })
    }

    originalIpcEmit = ipcRenderer.emit
    ipcRenderer.emit = (channel, ...args) => {
      ipcEmitCalls.push({ channel, args })
    }

    originalBusEmit = bus.$emit
    bus.$emit = (event, ...args) => {
      busCalls.push({ event, args })
    }
  })

  afterEach(() => {
    ipcRenderer.send = originalSend
    ipcRenderer.emit = originalIpcEmit
    bus.$emit = originalBusEmit
  })

  describe('IPC file operations (renderer-side emit)', () => {
    it('newTab emits mt::new-untitled-tab on ipcRenderer', () => {
      newTab()
      expect(ipcEmitCalls.length).to.equal(1)
      expect(ipcEmitCalls[0].channel).to.equal('mt::new-untitled-tab')
    })

    it('save emits mt::editor-ask-file-save on ipcRenderer', () => {
      save()
      expect(ipcEmitCalls.length).to.equal(1)
      expect(ipcEmitCalls[0].channel).to.equal('mt::editor-ask-file-save')
    })

    it('saveAs emits mt::editor-ask-file-save-as on ipcRenderer', () => {
      saveAs()
      expect(ipcEmitCalls.length).to.equal(1)
      expect(ipcEmitCalls[0].channel).to.equal('mt::editor-ask-file-save-as')
    })

    it('showCommandPalette emits mt::show-command-palette on ipcRenderer', () => {
      showCommandPalette()
      expect(ipcEmitCalls.length).to.equal(1)
      expect(ipcEmitCalls[0].channel).to.equal('mt::show-command-palette')
    })
  })

  describe('IPC file operations (main-process send)', () => {
    it('openFile sends mt::cmd-open-file to main', () => {
      openFile()
      expect(ipcSendCalls.length).to.equal(1)
      expect(ipcSendCalls[0].channel).to.equal('mt::cmd-open-file')
    })

    it('openFolder sends mt::cmd-open-folder to main', () => {
      openFolder()
      expect(ipcSendCalls.length).to.equal(1)
      expect(ipcSendCalls[0].channel).to.equal('mt::cmd-open-folder')
    })
  })

  describe('Bus view operations', () => {
    it('toggleSourceCode emits view:toggle-view-entry with sourceCode', () => {
      toggleSourceCode()
      expect(busCalls.length).to.equal(1)
      expect(busCalls[0].event).to.equal('view:toggle-view-entry')
      expect(busCalls[0].args[0]).to.equal('sourceCode')
    })

    it('toggleTypewriter emits view:toggle-view-entry with typewriter', () => {
      toggleTypewriter()
      expect(busCalls.length).to.equal(1)
      expect(busCalls[0].event).to.equal('view:toggle-view-entry')
      expect(busCalls[0].args[0]).to.equal('typewriter')
    })

    it('toggleFocus emits view:toggle-view-entry with focus', () => {
      toggleFocus()
      expect(busCalls.length).to.equal(1)
      expect(busCalls[0].event).to.equal('view:toggle-view-entry')
      expect(busCalls[0].args[0]).to.equal('focus')
    })

    it('toggleSidebar emits view:toggle-layout-entry with showSideBar', () => {
      toggleSidebar()
      expect(busCalls.length).to.equal(1)
      expect(busCalls[0].event).to.equal('view:toggle-layout-entry')
      expect(busCalls[0].args[0]).to.equal('showSideBar')
    })

    it('toggleTabBar emits view:toggle-layout-entry with showTabBar', () => {
      toggleTabBar()
      expect(busCalls.length).to.equal(1)
      expect(busCalls[0].event).to.equal('view:toggle-layout-entry')
      expect(busCalls[0].args[0]).to.equal('showTabBar')
    })
  })

  describe('IPC emit calls do not trigger bus', () => {
    it('newTab does not emit bus events', () => {
      newTab()
      expect(busCalls.length).to.equal(0)
    })
  })

  describe('Bus calls do not trigger IPC', () => {
    it('toggleSourceCode does not send IPC', () => {
      toggleSourceCode()
      expect(ipcSendCalls.length).to.equal(0)
      expect(ipcEmitCalls.length).to.equal(0)
    })
  })
})
