<template>
  <div
    class="preview-pane"
    ref="previewPane"
  >
    <div
      class="preview-content"
      ref="previewContent"
    >
    </div>
  </div>
</template>

<script>
import { renderMarkdownWithLines } from '@/utils/previewRenderer'
import { mapState } from 'vuex'
import bus from '@/bus'

export default {
  name: 'PreviewPane',

  props: {
    markdown: {
      type: String,
      required: true
    },
    cursor: {
      validator (value) {
        return typeof value === 'object'
      },
      default: null
    }
  },

  data () {
    return {
      renderedContent: '',
      renderTimer: null,
      previewContent: null,
      previewPane: null
    }
  },

  computed: {
    ...mapState({
      theme: state => state.preferences.theme,
      fontSize: state => state.preferences.fontSize,
      lineHeight: state => state.preferences.lineHeight,
      editorFontFamily: state => state.preferences.editorFontFamily
    })
  },

  watch: {
    markdown (newMarkdown) {
      // Only render if refs are available (after mounted)
      if (this.previewContent) {
        this.debouncedRender(newMarkdown)
      }
    },
    theme () {
      this.applyTheme()
    }
  },

  mounted () {
    this.previewContent = this.$refs.previewContent
    this.previewPane = this.$refs.previewPane

    // Apply initial theme
    this.applyTheme()

    // Set up scroll listener for sync
    this.previewPane.addEventListener('scroll', this.handleScroll)

    // Listen for image cache invalidation
    bus.$on('invalidate-image-cache', this.invalidateImageCache)

    // Initial render if markdown exists
    if (this.markdown) {
      this.renderPreview(this.markdown)
    }

    // Emit ready event after initial render
    this.$nextTick(() => {
      this.$emit('ready')
    })
  },

  beforeDestroy () {
    if (this.renderTimer) clearTimeout(this.renderTimer)
    this.previewPane.removeEventListener('scroll', this.handleScroll)
    bus.$off('invalidate-image-cache', this.invalidateImageCache)
  },

  methods: {
    /**
     * Render markdown immediately (for direct updates bypassing debounce)
     */
    immediateRender (markdown) {
      if (this.renderTimer) clearTimeout(this.renderTimer)
      this.renderPreview(markdown)
      this.renderTimer = null
    },

    /**
     * Render markdown to HTML with debounce
     */
    debouncedRender (markdown) {
      if (this.renderTimer) clearTimeout(this.renderTimer)
      this.renderTimer = setTimeout(() => {
        this.renderPreview(markdown)
        this.renderTimer = null
      }, 16) // ~1 frame delay for near-instant updates
    },

    /**
     * Render markdown content to preview pane
     */
    renderPreview (markdown) {
      try {
        const html = renderMarkdownWithLines(markdown, {
          superSubScript: true,
          footnote: true
        })
        this.previewContent.innerHTML = html
        this.renderedContent = html

        // Scroll to current cursor position if provided
        if (this.cursor) {
          this.scrollToCursor(this.cursor)
        }
      } catch (err) {
        console.error('Preview render error:', err)
        this.previewContent.innerHTML = '<p class="error">Preview render error</p>'
      }
    },

    /**
     * Scroll preview to match cursor position in editor
     */
    scrollToCursor (cursor) {
      if (!cursor || !cursor.anchor) return

      const line = cursor.anchor.line || 0
      const elements = this.previewContent.querySelectorAll('[data-line]')

      // Find closest element
      let targetElement = null
      for (const el of elements) {
        const elLine = parseInt(el.getAttribute('data-line'), 10)
        if (elLine <= line) {
          targetElement = el
        } else {
          break
        }
      }

      if (targetElement) {
        targetElement.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    },

    /**
     * Handle scroll event - emit for synchronization with editor
     */
    handleScroll () {
      const scrollTop = this.previewPane.scrollTop
      this.$emit('scroll', scrollTop)
    },

    /**
     * Apply theme styles to preview pane
     */
    applyTheme () {
      const content = this.previewContent
      if (!content) return

      // Apply theme class
      content.classList.remove('theme-light', 'theme-dark')
      content.classList.add(`theme-${this.theme}`)

      // Apply font styles
      content.style.fontSize = `${this.fontSize}px`
      content.style.lineHeight = this.lineHeight
      content.style.fontFamily = this.editorFontFamily
    },

    /**
     * Invalidate image cache and re-render
     */
    invalidateImageCache () {
      if (this.markdown) {
        this.renderPreview(this.markdown)
      }
    },

    /**
     * Get the preview container element (for scroll sync)
     */
    getPreviewContainer () {
      return this.previewPane
    },

    /**
     * Get the content element (for line mapping)
     */
    getPreviewContent () {
      return this.previewContent
    }
  }
}
</script>

<style scoped>
.preview-pane {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: auto;
  box-sizing: border-box;
  padding: 20px;
  background: var(--editorBgColor);
}

.preview-content {
  max-width: var(--editorAreaWidth);
  margin: 0 auto;
  padding: 50px 0;
  color: var(--editorColor);
}

.preview-content.theme-light {
  /* Light theme specific styles */
}

.preview-content.theme-dark {
  /* Dark theme specific styles */
}

/* Markdown content styles */
.preview-content h1,
.preview-content h2,
.preview-content h3,
.preview-content h4,
.preview-content h5,
.preview-content h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.preview-content h1 {
  font-size: 2em;
  border-bottom: 1px solid var(--editorBorderColor);
  padding-bottom: .3em;
}

.preview-content h2 {
  font-size: 1.5em;
  border-bottom: 1px solid var(--editorBorderColor);
  padding-bottom: .3em;
}

.preview-content p {
  margin-top: 0;
  margin-bottom: 16px;
}

.preview-content blockquote {
  padding: 0 1em;
  color: var(--editorColorQuoto);
  border-left: .25em solid var(--editorBorderColor);
  margin: 0 0 16px 0;
}

.preview-content code {
  padding: .2em .4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(27, 31, 35, .05);
  border-radius: 3px;
  font-family: var(--codeFontFamily);
}

.preview-content pre {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: var(--codeBlockBgColor);
  border-radius: 6px;
  margin-bottom: 16px;
}

.preview-content pre code {
  background-color: transparent;
  padding: 0;
}

.preview-content ul,
.preview-content ol {
  padding-left: 2em;
  margin-top: 0;
  margin-bottom: 16px;
}

.preview-content li {
  margin-top: .25em;
}

.preview-content table {
  border-spacing: 0;
  border-collapse: collapse;
  margin-bottom: 16px;
  width: 100%;
}

.preview-content table th,
.preview-content table td {
  padding: 6px 13px;
  border: 1px solid var(--editorBorderColor);
}

.preview-content table th {
  font-weight: 600;
  background-color: var(--editorBgColor);
}

.preview-content table tr {
  background-color: var(--editorBgColor);
  border-top: 1px solid var(--editorBorderColor);
}

.preview-content table tr:nth-child(2n) {
  background-color: var(--editorBgColorSecondary);
}

.preview-content img {
  max-width: 100%;
  box-sizing: content-box;
  background-color: var(--editorBgColor);
}

.preview-content hr {
  height: .25em;
  padding: 0;
  margin: 24px 0;
  background-color: var(--editorBorderColor);
  border: 0;
}

/* Error display */
.preview-content .error {
  color: #f56c6c;
  text-align: center;
  padding: 20px;
}
</style>
