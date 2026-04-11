<template>
  <div
    class="toolbar-container"
    v-show="showToolbar && !storeIsFullscreen"
  >
    <file-group :window-width="windowWidth"></file-group>

    <view-group :window-width="windowWidth"></view-group>

    <overflow-menu :window-width="windowWidth"></overflow-menu>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import { mapState } from 'vuex'
import FileGroup from './FileGroup'
import ViewGroup from './ViewGroup'
import OverflowMenu from './OverflowMenu'

export default {
  name: 'Toolbar',
  components: { FileGroup, ViewGroup, OverflowMenu },
  data () {
    return {
      windowWidth: window.innerWidth
    }
  },
  computed: {
    ...mapState({
      showToolbar: state => state.toolbar.showToolbar,
      storeIsFullscreen: state => state.toolbar.isFullscreen
    })
  },
  created () {
    ipcRenderer.on('mt::window-enter-full-screen', this.onEnterFullScreen)
    ipcRenderer.on('mt::window-leave-full-screen', this.onLeaveFullScreen)
  },
  mounted () {
    window.addEventListener('resize', this.onResize)
    this.windowWidth = window.innerWidth
  },
  beforeDestroy () {
    ipcRenderer.off('mt::window-enter-full-screen', this.onEnterFullScreen)
    ipcRenderer.off('mt::window-leave-full-screen', this.onLeaveFullScreen)
    window.removeEventListener('resize', this.onResize)
  },
  methods: {
    onEnterFullScreen () {
      this.$store.commit('SET_FULLSCREEN_STATE', true)
    },
    onLeaveFullScreen () {
      this.$store.commit('SET_FULLSCREEN_STATE', false)
    },
    onResize () {
      this.windowWidth = window.innerWidth
    }
  }
}
</script>

<style scoped>
.toolbar-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: var(--toolbarHeight);
  background: var(--toolbarBgColor);
  border-bottom: 1px solid var(--floatBorderColor);
  padding: 0 8px;
  box-sizing: border-box;
  user-select: none;
  flex-shrink: 0;
  position: relative;
  overflow: visible;
  z-index: 3;
}

.toolbar-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 2px;
}

.toolbar-group + .toolbar-group {
  margin-left: 8px;
  padding-left: 8px;
  border-left: 1px solid var(--floatBorderColor);
}
</style>
