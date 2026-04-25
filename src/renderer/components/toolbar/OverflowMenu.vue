<template>
  <div class="overflow-wrapper" v-click-outside="closeMenu">
    <toolbar-tooltip :content="$t('toolbar.moreActions')">
      <button class="toolbar-btn toolbar-overflow-btn" @click.stop="toggleMenu">
        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="currentColor"/></svg>
      </button>
    </toolbar-tooltip>
    <div v-if="isOpen" class="overflow-dropdown" @click.stop>
      <template v-if="isNarrow">
        <div class="overflow-item" @click="newTab">{{ $t('toolbar.newTab') }}</div>
        <div class="overflow-item" @click="openFolder">{{ $t('toolbar.openFolder') }}</div>
        <div class="overflow-item" @click="toggleSourceCode">{{ $t('toolbar.sourceCodeMode') }}</div>
        <div class="overflow-item" @click="toggleTabBar">{{ $t('toolbar.showTabBar') }}</div>
        <div class="overflow-separator"></div>
      </template>
      <div class="overflow-item" @click="moveTo">{{ $t('toolbar.moveTo') }}</div>
      <div class="overflow-item" @click="rename">{{ $t('toolbar.rename') }}</div>
      <div class="overflow-item" @click="importFile">{{ $t('toolbar.import') }}</div>
      <div class="overflow-item" @click="exportHtml">{{ $t('toolbar.exportHtml') }}</div>
      <div class="overflow-item" @click="exportPdf">{{ $t('toolbar.exportPdf') }}</div>
      <div class="overflow-item" @click="print">{{ $t('toolbar.print') }}</div>
      <div class="overflow-item" @click="reloadImages">{{ $t('toolbar.reloadImages') }}</div>
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import bus from '../../bus'
import ToolbarTooltip from './ToolbarTooltip'

export default {
  name: 'OverflowMenu',
  components: {
    ToolbarTooltip
  },
  props: {
    windowWidth: {
      type: Number,
      default: 1200
    }
  },
  data () {
    return {
      isOpen: false
    }
  },
  computed: {
    isNarrow () {
      return this.windowWidth < 600
    }
  },
  directives: {
    clickOutside: {
      bind (el, binding, vnode) {
        el.clickOutsideEvent = function (event) {
          if (!(el === event.target || el.contains(event.target))) {
            vnode.context[binding.expression](event)
          }
        }
        document.body.addEventListener('click', el.clickOutsideEvent)
      },
      unbind (el) {
        document.body.removeEventListener('click', el.clickOutsideEvent)
      }
    }
  },
  methods: {
    toggleMenu () {
      this.isOpen = !this.isOpen
    },
    closeMenu () {
      this.isOpen = false
    },
    newTab () {
      ipcRenderer.emit('mt::new-untitled-tab', null)
      this.closeMenu()
    },
    openFolder () {
      ipcRenderer.send('mt::cmd-open-folder')
      this.closeMenu()
    },
    toggleSourceCode () {
      bus.$emit('view:toggle-view-entry', 'sourceCode')
      this.closeMenu()
    },
    toggleTabBar () {
      bus.$emit('view:toggle-layout-entry', 'showTabBar')
      this.closeMenu()
    },
    moveTo () {
      ipcRenderer.emit('mt::editor-move-file', null)
      this.closeMenu()
    },
    rename () {
      ipcRenderer.emit('mt::editor-rename-file', null)
      this.closeMenu()
    },
    importFile () {
      ipcRenderer.send('mt::cmd-import-file')
      this.closeMenu()
    },
    exportHtml () {
      bus.$emit('showExportDialog', 'styledHtml')
      this.closeMenu()
    },
    exportPdf () {
      bus.$emit('showExportDialog', 'pdf')
      this.closeMenu()
    },
    print () {
      bus.$emit('showExportDialog', 'print')
      this.closeMenu()
    },
    reloadImages () {
      ipcRenderer.emit('mt::invalidate-image-cache', null)
      this.closeMenu()
    }
  }
}
</script>

<style scoped>
.overflow-wrapper {
  position: relative;
  display: inline-block;
}

.toolbar-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--toolbarIconColor);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
}

.toolbar-btn:hover {
  background: var(--floatHoverColor);
  color: var(--toolbarIconHoverColor);
}

.toolbar-btn svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.overflow-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--floatBgColor);
  border: 1px solid var(--floatBorderColor);
  border-radius: 4px;
  min-width: 160px;
  z-index: 100;
  box-shadow: var(--floatShadow);
  padding: 4px 0;
  margin-top: 4px;
}

.overflow-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 13px;
  color: var(--editorColor);
  white-space: nowrap;
  transition: background 0.2s ease;
}

.overflow-item:hover {
  background: var(--floatHoverColor);
}

.overflow-separator {
  height: 1px;
  background: var(--floatBorderColor);
  margin: 4px 0;
}
</style>
