<template>
  <div class="split-preview-container">
    <!-- Source code editor pane -->
    <div
      v-show="sourcePaneVisible"
      class="source-pane"
      :style="{ width: sourcePaneVisible && previewPaneVisible ? sourcePaneWidth + '%' : '100%' }"
    >
      <div class="pane-header">
        <span class="pane-title">{{ sourceCodeTitle }}</span>
        <button
          class="pane-toggle-btn"
          :disabled="!previewPaneVisible"
          @click="toggleSourcePane"
          :title="$t('toolbar.toggleSourcePane')"
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path v-if="sourcePaneVisible && previewPaneVisible" fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            <path v-else fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
          </svg>
        </button>
      </div>
      <source-code
        ref="sourceCode"
        :markdown="markdown"
        :cursor="cursor"
        :text-direction="textDirection"
        :focus="focus"
        :typewriter="typewriter"
        @mounted="onSourceCodeMounted"
        @content-change="handleContentChange"
      />
    </div>

    <!-- Drag handle for resizing (only show when both panes visible) -->
    <div
      v-show="sourcePaneVisible && previewPaneVisible"
      class="split-handle"
      @mousedown="startResize"
    >
      <div class="handle-line"></div>
    </div>

    <!-- Preview pane -->
    <div
      v-show="previewPaneVisible"
      class="preview-pane-wrapper"
      :style="{ width: sourcePaneVisible && previewPaneVisible ? previewPaneWidth + '%' : '100%' }"
    >
      <div class="pane-header">
        <span class="pane-title">{{ previewTitle }}</span>
        <button
          class="pane-toggle-btn"
          :disabled="!sourcePaneVisible"
          @click="togglePreviewPane"
          :title="$t('toolbar.togglePreviewPane')"
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path v-if="previewPaneVisible && sourcePaneVisible" fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            <path v-else fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
          </svg>
        </button>
      </div>
      <preview-pane
        ref="previewPane"
        :markdown="currentMarkdown"
        :cursor="cursor"
        @scroll="handlePreviewScroll"
        @ready="onPreviewReady"
      />
    </div>

    <!-- Hidden pane toggle buttons (show when pane is hidden) -->
    <button
      v-show="!sourcePaneVisible"
      class="hidden-pane-toggle left"
      @click="toggleSourcePane"
      :title="$t('toolbar.showSourcePane')"
    >
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
      </svg>
    </button>
    <button
      v-show="!previewPaneVisible"
      class="hidden-pane-toggle right"
      @click="togglePreviewPane"
      :title="$t('toolbar.showPreviewPane')"
    >
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
      </svg>
    </button>
  </div>
</template>

<script>
import SourceCode from './sourceCode.vue'
import PreviewPane from './previewPane.vue'
import { ScrollSyncManager } from '@/utils/scrollSync'
import bus from '@/bus'
import i18n from '@/i18n'
import { mapState } from 'vuex'

export default {
  name: 'SplitPreview',

  components: {
    SourceCode,
    PreviewPane
  },

  props: {
    markdown: {
      type: String,
      required: true
    },
    cursor: {
      validator (value) {
        return typeof value === 'object'
      },
      required: true
    },
    textDirection: {
      type: String,
      required: true
    },
    platform: {
      type: String,
      default: 'desktop'
    }
  },

  data () {
    return {
      sourcePaneWidth: 50,
      previewPaneWidth: 50,
      isResizing: false,
      scrollSync: null,
      sourceCodeReady: false,
      previewPaneReady: false,
      currentMarkdown: this.markdown, // Initialize from prop immediately
      editor: null, // CodeMirror editor instance
      sourcePaneVisible: false, // Source code pane visibility - default hidden, show only preview
      previewPaneVisible: true // Preview pane visibility - default visible
    }
  },

  computed: {
    ...mapState({
      focus: state => state.preferences.focus,
      typewriter: state => state.preferences.typewriter
    }),
    sourceCodeTitle () {
      return i18n.t('toolbar.sourceCodePane')
    },
    previewTitle () {
      return i18n.t('toolbar.previewPane')
    }
  },

  watch: {
    markdown (newVal) {
      // Update local markdown when prop changes (e.g., file switch)
      this.currentMarkdown = newVal
    }
  },

  mounted () {
    // Listen for file changes
    bus.$on('file-loaded', this.handleFileChange)
    bus.$on('file-changed', this.handleFileChange)
  },

  beforeDestroy () {
    bus.$off('file-loaded', this.handleFileChange)
    bus.$off('file-changed', this.handleFileChange)

    // Destroy scroll sync manager
    if (this.scrollSync) {
      this.scrollSync.destroy()
      this.scrollSync = null
    }
  },

  methods: {
    /**
     * Toggle source code pane visibility
     * Cannot close if preview pane is also closed (must have at least one pane)
     */
    toggleSourcePane () {
      if (this.sourcePaneVisible && !this.previewPaneVisible) {
        // Cannot close - preview is already closed
        return
      }
      this.sourcePaneVisible = !this.sourcePaneVisible

      // Refresh CodeMirror when source pane becomes visible
      if (this.sourcePaneVisible) {
        this.$nextTick(() => {
          const sourceCodeRef = this.$refs.sourceCode
          if (sourceCodeRef && sourceCodeRef.editor) {
            sourceCodeRef.editor.refresh()
          }
        })
      }

      // Reinitialize scroll sync when both panes become visible
      if (this.sourcePaneVisible && this.previewPaneVisible) {
        this.$nextTick(() => {
          // Delay a bit more to ensure layout is stable
          setTimeout(() => {
            if (this.scrollSync) {
              this.scrollSync.reinit()
            } else {
              this.tryInitScrollSync()
            }
          }, 100)
        })
      } else if (this.scrollSync) {
        // Destroy scroll sync when one pane is hidden
        this.scrollSync.destroy()
        this.scrollSync = null
      }
    },

    /**
     * Toggle preview pane visibility
     * Cannot close if source pane is also closed (must have at least one pane)
     */
    togglePreviewPane () {
      if (this.previewPaneVisible && !this.sourcePaneVisible) {
        // Cannot close - source is already closed
        return
      }
      this.previewPaneVisible = !this.previewPaneVisible

      // Reinitialize scroll sync when both panes become visible
      if (this.sourcePaneVisible && this.previewPaneVisible) {
        this.$nextTick(() => {
          // Delay a bit more to ensure layout is stable
          setTimeout(() => {
            if (this.scrollSync) {
              this.scrollSync.reinit()
            } else {
              this.tryInitScrollSync()
            }
          }, 100)
        })
      } else if (this.scrollSync) {
        // Destroy scroll sync when one pane is hidden
        this.scrollSync.destroy()
        this.scrollSync = null
      }
    },

    /**
     * Called when source code editor is mounted
     */
    onSourceCodeMounted (data) {
      this.sourceCodeReady = true
      this.editor = data.editor
      // Reset scroll position to top when entering split preview mode
      if (this.editor) {
        const cmScroll = this.editor.getWrapperElement()?.querySelector('.CodeMirror-scroll')
        if (cmScroll) {
          cmScroll.scrollTop = 0
        }
      }
      this.tryInitScrollSync()
    },

    /**
     * Called when preview pane is ready (after first render)
     */
    onPreviewReady () {
      this.previewPaneReady = true
      // Reset preview scroll position to top
      if (this.$refs.previewPane) {
        this.$refs.previewPane.getPreviewContainer().scrollTop = 0
      }
      this.tryInitScrollSync()
    },

    /**
     * Try to initialize scroll sync (requires both components ready)
     */
    tryInitScrollSync () {
      if (!this.sourceCodeReady || !this.previewPaneReady) {
        return
      }

      const sourceCodeComponent = this.$refs.sourceCode
      const previewPaneComponent = this.$refs.previewPane

      if (!sourceCodeComponent || !previewPaneComponent) {
        return
      }

      const editor = this.editor
      const previewContainer = previewPaneComponent.getPreviewContainer()
      const previewContent = previewPaneComponent.getPreviewContent()

      if (editor && previewContainer && previewContent) {
        // Delay to ensure CodeMirror layout is stable
        const initScrollSync = () => {
          // Check if CodeMirror-scroll has proper dimensions
          const cmScroll = editor.getWrapperElement()?.querySelector('.CodeMirror-scroll')
          if (cmScroll && cmScroll.scrollHeight > 0 && cmScroll.clientHeight > 0) {
            // Reset scroll position to top before initializing sync
            cmScroll.scrollTop = 0
            previewContainer.scrollTop = 0

            if (this.scrollSync) {
              this.scrollSync.reinit()
            } else {
              this.scrollSync = new ScrollSyncManager(
                editor,
                previewContainer,
                previewContent
              )
            }
          } else {
            // Retry after another delay
            setTimeout(initScrollSync, 100)
          }
        }

        // Initial delay before first attempt
        setTimeout(initScrollSync, 300)
      }
    },

    /**
     * Handle immediate content change from sourceCode editor
     */
    handleContentChange (markdown) {
      // Update local markdown state - preview will update via watch (16ms debounce)
      this.currentMarkdown = markdown

      // Invalidate scroll sync cache on content change
      if (this.scrollSync) {
        this.scrollSync.invalidateCache()
      }
    },

    /**
     * Handle file change event
     */
    handleFileChange ({ id, markdown, cursor }) {
      // Update local markdown on file switch
      this.currentMarkdown = markdown

      // Invalidate scroll sync cache on content change
      if (this.scrollSync) {
        this.scrollSync.invalidateCache()
      }
    },

    /**
     * Handle preview scroll event
     */
    handlePreviewScroll (scrollTop) {
      // Scroll sync is handled by ScrollSyncManager
    },

    /**
     * Start resizing split panes
     */
    startResize (event) {
      this.isResizing = true

      // Prevent text selection during resize
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      const containerRect = this.$el.getBoundingClientRect()
      const containerWidth = containerRect.width
      const startX = event.clientX
      const startSourceWidth = this.sourcePaneWidth

      const onMouseMove = (e) => {
        const deltaX = e.clientX - startX
        const deltaPercent = (deltaX / containerWidth) * 100

        // Calculate new widths with constraints
        let newSourceWidth = startSourceWidth + deltaPercent
        newSourceWidth = Math.max(20, Math.min(80, newSourceWidth)) // Min 20%, max 80%

        this.sourcePaneWidth = newSourceWidth
        this.previewPaneWidth = 100 - newSourceWidth
      }

      const onMouseUp = () => {
        this.isResizing = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''

        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)

      event.preventDefault()
    },

    /**
     * Get source code editor instance (for external access)
     */
    getEditor () {
      return this.$refs.sourceCode?.editor
    },

    /**
     * Get preview pane component (for external access)
     */
    getPreviewPane () {
      return this.$refs.previewPane
    }
  }
}
</script>

<style scoped>
.split-preview-container {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: var(--editorBgColor);
  position: relative;
}

.source-pane {
  height: 100%;
  min-width: 20%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: var(--editorBgColor);
  border-bottom: 1px solid var(--editorBorderColor);
  height: 28px;
  flex-shrink: 0;
}

.pane-title {
  font-size: 12px;
  color: var(--editorColor50);
  font-weight: 500;
}

.pane-toggle-btn {
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--editorColor50);
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.pane-toggle-btn:hover:not(:disabled) {
  background: var(--floatHoverColor);
  color: var(--themeColor);
}

.pane-toggle-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Deep selector to style child components */
.source-pane >>> .source-code {
  flex: 1;
  width: 100%;
  min-height: 0;
  height: auto;
  overflow: auto;
}

.preview-pane-wrapper {
  height: 100%;
  min-width: 20%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-pane-wrapper >>> .preview-pane {
  flex: 1;
  min-height: 0;
  height: auto;
  overflow: auto;
}

.split-handle {
  width: 6px;
  height: 100%;
  background: var(--editorBorderColor);
  cursor: col-resize;
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}

.split-handle:hover {
  background: var(--floatHoverColor);
}

.handle-line {
  position: absolute;
  left: 2px;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 30px;
  background: var(--editorColor50);
  border-radius: 1px;
}

.split-handle:hover .handle-line {
  background: var(--themeColor);
}

/* Hidden pane toggle buttons */
.hidden-pane-toggle {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: var(--editorBgColor);
  border: 1px solid var(--editorBorderColor);
  padding: 8px 4px;
  cursor: pointer;
  color: var(--editorColor50);
  z-index: 20;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.hidden-pane-toggle:hover {
  background: var(--floatHoverColor);
  color: var(--themeColor);
  border-color: var(--themeColor);
}

.hidden-pane-toggle.left {
  left: 0;
  border-radius: 0 4px 4px 0;
}

.hidden-pane-toggle.right {
  right: 0;
  border-radius: 4px 0 0 4px;
}
</style>
