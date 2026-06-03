<template>
  <div
    class="editor-container"
  >
    <title-bar
      :project="projectTree"
      :pathname="pathname"
      :filename="filename"
      :active="windowActive"
      :word-count="wordCount"
      :platform="platform"
      :is-saved="isSaved"
    ></title-bar>
    <div class="editor-middle">
      <toolbar v-if="init"></toolbar>
      <div class="editor-placeholder" v-if="!init"></div>
      <div v-else class="workspace-content">
        <side-bar></side-bar>
        <recent
          v-if="!hasCurrentFile"
        ></recent>
        <editor-with-tabs
          v-else
          :markdown="markdown"
          :cursor="cursor"
          :source-code="sourceCode"
          :split-preview="splitPreview"
          :show-tab-bar="showTabBar"
          :text-direction="textDirection"
          :platform="platform"
        ></editor-with-tabs>
        <div class="ai-drag-bar" ref="aiDragBar" v-if="showAiPanel"></div>
        <ai-assistant v-if="showAiPanel" :style="{ width: localAiPanelWidth + 'px' }"></ai-assistant>
      </div>
      <command-palette></command-palette>
      <about-dialog></about-dialog>
      <export-setting-dialog></export-setting-dialog>
      <rename></rename>
      <tweet></tweet>
      <import-modal></import-modal>
      <smart-rewrite-panel></smart-rewrite-panel>
      <wiki-generator></wiki-generator>
    </div>
  </div>
</template>

<script>
import { addStyles, addThemeStyle } from '@/util/theme'
import Recent from '@/components/recent'
import EditorWithTabs from '@/components/editorWithTabs'
import TitleBar from '@/components/titleBar'
import Toolbar from '@/components/toolbar'
import SideBar from '@/components/sideBar'
import AboutDialog from '@/components/about'
import CommandPalette from '@/components/commandPalette'
import ExportSettingDialog from '@/components/exportSettings'
import Rename from '@/components/rename'
import Tweet from '@/components/tweet'
import ImportModal from '@/components/import'
import AiAssistant from '@/components/aiAssistant'
import SmartRewritePanel from '@/components/smartRewrite'
import WikiGenerator from '@/components/wikiGenerator'
import { loadingPageMixins } from '@/mixins'
import { mapState } from 'vuex'
import bus from '@/bus'
import { DEFAULT_STYLE } from '@/config'
import { ipcRenderer } from 'electron'

export default {
  name: 'markdownpp',
  components: {
    Recent,
    EditorWithTabs,
    TitleBar,
    Toolbar,
    SideBar,
    AboutDialog,
    ExportSettingDialog,
    Rename,
    Tweet,
    ImportModal,
    AiAssistant,
    SmartRewritePanel,
    CommandPalette,
    WikiGenerator
  },
  mixins: [loadingPageMixins],
  data () {
    return {
      localAiPanelWidth: 320,
      aiDragHandler: null
    }
  },
  computed: {
    ...mapState({
      showTabBar: state => state.layout.showTabBar,
      showAiPanel: state => state.layout.showAiPanel,
      sourceCode: state => state.preferences.sourceCode,
      splitPreview: state => state.preferences.splitPreview,
      theme: state => state.preferences.theme,
      textDirection: state => state.preferences.textDirection
    }),
    ...mapState({
      aiPanelWidth: state => state.layout.aiPanelWidth
    }),
    ...mapState({
      zoom: state => state.preferences.zoom
    }),
    ...mapState({
      projectTree: state => state.project.projectTree,
      pathname: state => state.editor.currentFile.pathname,
      filename: state => state.editor.currentFile.filename,
      isSaved: state => state.editor.currentFile.isSaved,
      markdown: state => state.editor.currentFile.markdown,
      cursor: state => state.editor.currentFile.cursor,
      wordCount: state => state.editor.currentFile.wordCount
    }),
    ...mapState([
      'windowActive', 'platform', 'init'
    ]),
    hasCurrentFile () {
      return this.markdown !== undefined
    }
  },
  watch: {
    theme: function (value, oldValue) {
      if (value !== oldValue) {
        addThemeStyle(value)
      }
    },
    zoom: function (zoom) {
      ipcRenderer.emit('mt::window-zoom', null, zoom)
    },
    aiPanelWidth (newVal) {
      this.localAiPanelWidth = newVal
    },
    showAiPanel (newVal) {
      if (newVal) {
        this.$nextTick(() => {
          this.initAiDragBar()
        })
      }
    }
  },
  created () {
    const { commit, dispatch } = this.$store

    // Apply initial state (theme and titleBarStyle) and delay load other values.
    if (global.markdownpp.initialState) {
      commit('SET_USER_PREFERENCE', global.markdownpp.initialState)
    }

    // store/index.js
    dispatch('LINTEN_WIN_STATUS')
    // module: command center
    dispatch('LISTEN_COMMAND_CENTER_BUS')
    // module: tweet
    dispatch('LISTEN_FOR_TWEET')
    // module: layout
    dispatch('LISTEN_FOR_LAYOUT')
    // module: listenForMain
    dispatch('LISTEN_FOR_EDIT')
    dispatch('LISTEN_FOR_VIEW')
    dispatch('LISTEN_FOR_SHOW_DIALOG')
    dispatch('LISTEN_FOR_PARAGRAPH_INLINE_STYLE')
    // module: project
    dispatch('LISTEN_FOR_UPDATE_PROJECT')
    dispatch('LISTEN_FOR_LOAD_PROJECT')
    dispatch('LISTEN_FOR_SIDEBAR_CONTEXT_MENU')
    // module: autoUpdates
    dispatch('LISTEN_FOR_UPDATE')
    // module: editor
    dispatch('LISTEN_SCREEN_SHOT')
    dispatch('ASK_FOR_USER_PREFERENCE')
    dispatch('LISTEN_TOGGLE_VIEW')
    dispatch('LISTEN_FOR_CLOSE')
    dispatch('LISTEN_FOR_SAVE_AS')
    dispatch('LISTEN_FOR_MOVE_TO')
    dispatch('LISTEN_FOR_SAVE')
    dispatch('LISTEN_FOR_SET_PATHNAME')
    dispatch('LISTEN_FOR_BOOTSTRAP_WINDOW')
    dispatch('LISTEN_FOR_SAVE_CLOSE')
    dispatch('LISTEN_FOR_RENAME')
    dispatch('LINTEN_FOR_SET_LINE_ENDING')
    dispatch('LINTEN_FOR_SET_ENCODING')
    dispatch('LINTEN_FOR_SET_FINAL_NEWLINE')
    dispatch('LISTEN_FOR_NEW_TAB')
    dispatch('LISTEN_FOR_CLOSE_TAB')
    dispatch('LISTEN_FOR_TAB_CYCLE')
    dispatch('LISTEN_FOR_SWITCH_TABS')
    dispatch('LINTEN_FOR_PRINT_SERVICE_CLEARUP')
    dispatch('LINTEN_FOR_EXPORT_SUCCESS')
    dispatch('LISTEN_FOR_FILE_CHANGE')
    dispatch('LISTEN_WINDOW_ZOOM')
    dispatch('LISTEN_FOR_RELOAD_IMAGES')
    dispatch('LISTEN_FOR_CONTEXT_MENU')
    dispatch('LISTEN_FOR_TOOLBAR')

    // module: notification
    dispatch('LISTEN_FOR_NOTIFICATION')

    // prevent Chromium's default behavior and try to open the first file
    window.addEventListener('dragover', e => {
      // Cancel to allow tab drag&drop.
      if (!e.dataTransfer.types.length) return

      if (e.dataTransfer.types.indexOf('Files') >= 0) {
        if (e.dataTransfer.items.length === 1 && e.dataTransfer.items[0].type.indexOf('image') > -1) {
          // Do nothing, because we already drag/drop image in muya.
        } else {
          e.preventDefault()
          if (this.timer) {
            clearTimeout(this.timer)
          }
          this.timer = setTimeout(() => {
            bus.$emit('importDialog', false)
          }, 300)
          bus.$emit('importDialog', true)
        }

        e.dataTransfer.dropEffect = 'copy'
      } else {
        e.stopPropagation()
        e.dataTransfer.dropEffect = 'none'
      }
    }, false)

    this.$nextTick(() => {
      const style = global.markdownpp.initialState || DEFAULT_STYLE
      addStyles(style)
      this.hideLoadingPage()
    })
  },
  mounted () {
    this.initAiDragBar()
  },
  beforeDestroy () {
    this.cleanupAiDragBar()
  },
  methods: {
    cleanupAiDragBar () {
      if (this.aiDragHandler) {
        const dragBar = this.$refs.aiDragBar
        if (dragBar) {
          dragBar.removeEventListener('mousedown', this.aiDragHandler.onMouseDown)
        }
        this.aiDragHandler = null
      }
    },
    initAiDragBar () {
      this.cleanupAiDragBar()

      const dragBar = this.$refs.aiDragBar
      if (!dragBar) return

      // Initialize local width from computed (vuex store)
      this.localAiPanelWidth = this.aiPanelWidth

      let isDragging = false
      let startX = 0
      let startWidth = this.localAiPanelWidth

      const onMouseMove = (e) => {
        if (!isDragging) return
        const deltaX = e.clientX - startX
        const newWidth = Math.max(200, Math.min(600, startWidth - deltaX))
        this.localAiPanelWidth = newWidth
      }

      const onMouseUp = () => {
        if (!isDragging) return
        isDragging = false
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        this.$store.dispatch('SET_AI_PANEL_WIDTH', this.localAiPanelWidth)
      }

      const onMouseDown = (e) => {
        e.preventDefault()
        e.stopPropagation()
        isDragging = true
        startX = e.clientX
        startWidth = this.localAiPanelWidth
        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
      }

      this.aiDragHandler = { onMouseDown }
      dragBar.addEventListener('mousedown', onMouseDown)
    }
  }
}
</script>

<style scoped>
  .editor-placeholder,
  .editor-container {
    display: flex;
    flex-direction: column;
    position: absolute;
    width: 100vw;
    height: 100vh;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  .editor-container .hide {
    z-index: -1;
    opacity: 0;
    position: absolute;
    left: -10000px;
  }
  .editor-placeholder {
    background: var(--editorBgColor);
  }
  .editor-middle {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    position: relative;
    & > .editor {
      flex: 1;
    }
  }
  .workspace-content {
    display: flex;
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }
  .ai-drag-bar {
    width: 4px;
    cursor: col-resize;
    background: var(--borderColor);
    flex-shrink: 0;
    position: relative;
    z-index: 10;
  }
  .ai-drag-bar:hover {
    background: var(--themeColor);
  }
  .ai-drag-bar:hover {
    background: var(--themeColor);
  }
</style>
