<template>
  <div class="toolbar-group">
    <toolbar-tooltip :content="$t('toolbar.newTabShortcut')" v-show="!isNarrow">
      <button class="toolbar-btn" @click="newTab">
        <svg viewBox="0 0 24 24" width="16" height="16"><path :d="icons.newTab" /></svg>
      </button>
    </toolbar-tooltip>

    <toolbar-tooltip :content="$t('toolbar.openFileShortcut')">
      <button class="toolbar-btn" @click="openFile">
        <svg viewBox="0 0 24 24" width="16" height="16"><path :d="icons.openFile" /></svg>
      </button>
    </toolbar-tooltip>

    <toolbar-tooltip :content="$t('toolbar.openFolder')" v-show="!isNarrow">
      <button class="toolbar-btn" @click="openFolder">
        <svg viewBox="0 0 24 24" width="16" height="16"><path :d="icons.openFolder" /></svg>
      </button>
    </toolbar-tooltip>

    <toolbar-tooltip :content="$t('toolbar.saveShortcut')">
      <button class="toolbar-btn" :disabled="!hasFile" @click="save">
        <svg viewBox="0 0 24 24" width="16" height="16"><path :d="icons.save" /></svg>
      </button>
    </toolbar-tooltip>

    <toolbar-tooltip :content="$t('toolbar.saveAsShortcut')">
      <button class="toolbar-btn" :disabled="!hasFile" @click="saveAs">
        <svg viewBox="0 0 24 24" width="16" height="16"><path :d="icons.saveAs" /></svg>
      </button>
    </toolbar-tooltip>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import { mapState } from 'vuex'
import { openFile, openFolder } from '../../util/toolbarActions'
import { toolbarIcons } from '../../util/toolbarIcons'
import ToolbarTooltip from './ToolbarTooltip'

export default {
  name: 'FileGroup',
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
      icons: toolbarIcons
    }
  },
  computed: {
    ...mapState({
      tabs: state => state.editor.tabs
    }),
    hasFile () {
      return this.tabs.length > 0
    },
    isNarrow () {
      return this.windowWidth < 600
    }
  },
  methods: {
    newTab () {
      ipcRenderer.emit('mt::new-untitled-tab', null)
    },
    openFile,
    openFolder,
    save () {
      ipcRenderer.emit('mt::editor-ask-file-save', null)
    },
    saveAs () {
      ipcRenderer.emit('mt::editor-ask-file-save-as', null)
    }
  }
}
</script>

<style scoped>
.toolbar-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 2px;
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

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.toolbar-btn svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}
</style>
