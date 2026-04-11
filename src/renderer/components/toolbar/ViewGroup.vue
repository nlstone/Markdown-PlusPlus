<template>
  <div class="toolbar-group">
    <toolbar-tooltip content="Command Palette">
      <button class="toolbar-btn" @click="showCommandPalette">
        <svg viewBox="0 0 24 24" width="16" height="16"><path :d="icons.commandPalette" /></svg>
      </button>
    </toolbar-tooltip>

    <toolbar-tooltip content="Source Code Mode" v-show="!isNarrow">
      <button class="toolbar-btn" :class="{ active: sourceCode }" @click="toggleSourceCode">
        <svg viewBox="0 0 24 24" width="16" height="16"><path :d="icons.sourceCode" /></svg>
      </button>
    </toolbar-tooltip>

    <toolbar-tooltip content="Typewriter Mode">
      <button class="toolbar-btn" :class="{ active: typewriter }" @click="toggleTypewriter">
        <svg viewBox="0 0 24 24" width="16" height="16"><path :d="icons.typewriter" /></svg>
      </button>
    </toolbar-tooltip>

    <toolbar-tooltip content="Focus Mode">
      <button class="toolbar-btn" :class="{ active: focus }" @click="toggleFocus">
        <svg viewBox="0 0 24 24" width="16" height="16"><path :d="icons.focusMode" /></svg>
      </button>
    </toolbar-tooltip>

    <toolbar-tooltip content="Show Sidebar">
      <button class="toolbar-btn" :class="{ active: showSideBar }" @click="toggleSidebar">
        <svg viewBox="0 0 24 24" width="16" height="16"><path :d="icons.showSidebar" /></svg>
      </button>
    </toolbar-tooltip>

    <toolbar-tooltip content="Show Tab Bar" v-show="!isNarrow">
      <button class="toolbar-btn" :class="{ active: showTabBar }" @click="toggleTabBar">
        <svg viewBox="0 0 24 24" width="16" height="16"><path :d="icons.showTabBar" /></svg>
      </button>
    </toolbar-tooltip>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import {
  showCommandPalette,
  toggleSourceCode,
  toggleTypewriter,
  toggleFocus,
  toggleSidebar,
  toggleTabBar
} from '../../util/toolbarActions'
import { toolbarIcons } from '../../util/toolbarIcons'
import ToolbarTooltip from './ToolbarTooltip'

export default {
  name: 'ViewGroup',
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
      sourceCode: state => state.preferences.sourceCode,
      typewriter: state => state.preferences.typewriter,
      focus: state => state.preferences.focus,
      showSideBar: state => state.layout.showSideBar,
      showTabBar: state => state.layout.showTabBar
    }),
    isNarrow () {
      return this.windowWidth < 600
    }
  },
  methods: {
    showCommandPalette,
    toggleSourceCode,
    toggleTypewriter,
    toggleFocus,
    toggleSidebar,
    toggleTabBar
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

.toolbar-btn.active {
  background: var(--floatHoverColor);
  color: var(--themeColor);
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
