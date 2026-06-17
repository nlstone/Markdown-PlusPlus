<template>
  <div
    v-show="showSideBar"
    class="side-bar"
    ref="sideBar"
    :style="[ !rightColumn ? { 'min-width': '45px' } : {}, { 'width': `${finalSideBarWidth}px` } ]"
  >
    <div class="left-column">
      <ul>
        <li
          v-for="(c, index) of sideBarIcons"
          :key="index"
          @click.stop="handleLeftIconClick(c.name)"
          :class="{ 'active': isIconActive(c.name) }"
          :title="$t(c.title)"
        >
          <svg :viewBox="c.icon.viewBox">
            <use :xlink:href="c.icon.url"></use>
          </svg>
        </li>
      </ul>
      <div
        v-if="showWikiMenu"
        class="wiki-picker"
        :style="wikiPickerStyle"
        @click.stop
      >
        <div class="wiki-picker-title">{{ wikiText('sidebar.wikiPicker.title', '选择项目文档') }}</div>
        <div
          v-for="source of wikiSources"
          :key="source.name"
          class="wiki-picker-section"
        >
          <div class="wiki-picker-section-title">{{ source.title }}</div>
          <button
            v-for="version of source.versions"
            :key="source.name + '-' + version.versionPath"
            class="wiki-picker-item"
            :class="{ active: isWikiVersionActive(source.name, version.versionPath) }"
            @click="openWikiVersion(source.name, version.versionPath)"
          >
            <span class="wiki-picker-version">{{ version.title || version.versionPath }}</span>
            <span class="wiki-picker-meta">
              {{ version.versionPath }}
              <span v-if="version.isCurrent"> · {{ wikiText('sidebar.wikiPicker.current', '当前') }}</span>
            </span>
          </button>
        </div>
        <div class="wiki-picker-empty" v-if="!wikiSources.length">
          {{ wikiText('sidebar.wikiPicker.empty', '未找到项目文档') }}
        </div>
      </div>
      <ul class="bottom">
        <li
          v-for="(c, index) of sideBarBottomIcons"
          :key="index"
          @click.stop="handleLeftBottomClick(c.name)"
          :title="$t(c.title)"
        >
          <svg :viewBox="c.icon.viewBox">
            <use :xlink:href="c.icon.url"></use>
          </svg>
        </li>
      </ul>
    </div>
    <div class="right-column" v-show="rightColumn">
      <tree
        :project-tree="projectTree"
        :opened-files="openedFiles"
        :tabs="tabs"
        v-if="rightColumn === 'files'"
      ></tree>
      <side-bar-search
        v-else-if="rightColumn === 'search'"
      ></side-bar-search>
      <toc
        v-else-if="rightColumn === 'toc'"
      ></toc>
      <zread
        v-else-if="rightColumn === 'zread'"
      ></zread>
      <wiki
        v-else-if="rightColumn === 'wiki'"
      ></wiki>
    </div>
    <div class="drag-bar" ref="dragBar" v-show="rightColumn"></div>
  </div>
</template>

<script>
import { sideBarIcons, sideBarBottomIcons } from './help'
import Tree from './tree.vue'
import SideBarSearch from './search.vue'
import Toc from './toc.vue'
import Zread from './zread.vue'
import Wiki from './wiki.vue'
import { mapState } from 'vuex'

export default {
  data () {
    this.sideBarIcons = sideBarIcons
    this.sideBarBottomIcons = sideBarBottomIcons
    return {
      openedFiles: [],
      sideBarViewWidth: 280,
      showWikiMenu: false
    }
  },
  components: {
    Tree,
    SideBarSearch,
    Toc,
    Zread,
    Wiki
  },
  computed: {
    ...mapState({
      rightColumn: state => state.layout.rightColumn,
      showSideBar: state => state.layout.showSideBar,
      showAiPanel: state => state.layout.showAiPanel,
      projectTree: state => state.project.projectTree,
      sideBarWidth: state => state.layout.sideBarWidth,
      tabs: state => state.editor.tabs,
      hasZread: state => state.zread.hasZread,
      hasWiki: state => state.wiki.hasWiki,
      wikiRootPath: state => state.wiki.rootPath,
      wikiVersionPath: state => state.wiki.versionPath,
      wikiVersions: state => state.wiki.versions,
      zreadRootPath: state => state.zread.rootPath,
      zreadVersionPath: state => state.zread.versionPath,
      zreadVersions: state => state.zread.versions
    }),
    finalSideBarWidth () {
      const { showSideBar, rightColumn, sideBarViewWidth } = this
      if (!showSideBar) return 0
      if (rightColumn === '') return 45
      return sideBarViewWidth < 220 ? 220 : sideBarViewWidth
    },
    wikiPickerStyle () {
      return {
        position: 'absolute',
        top: '192px',
        left: '43px',
        width: '248px',
        zIndex: 1000
      }
    },
    wikiSources () {
      const sources = []
      if (this.hasWiki) {
        sources.push({
          name: 'wiki',
          title: this.wikiText('sidebar.wikiPicker.mdpp', '.md++ 项目文档'),
          versions: this.wikiVersions && this.wikiVersions.length ? this.wikiVersions : [{ versionPath: this.wikiVersionPath, title: this.wikiVersionPath, isCurrent: true }]
        })
      }
      if (this.hasZread) {
        sources.push({
          name: 'zread',
          title: this.wikiText('sidebar.wikiPicker.zread', '.zread 兼容文档'),
          versions: this.zreadVersions && this.zreadVersions.length ? this.zreadVersions : [{ versionPath: this.zreadVersionPath, title: this.zreadVersionPath, isCurrent: true }]
        })
      }
      return sources.filter(source => source.versions.some(version => version && version.versionPath))
    }
  },
  watch: {
    projectTree: {
      handler (tree) {
        if (tree && tree.pathname) {
          // Check for ZRead when project changes
          this.$store.dispatch('zread/CHECK_ZREAD', tree.pathname)
          // Check for .md++ wiki when project changes
          this.$store.dispatch('wiki/CHECK_WIKI', tree.pathname)
        } else {
          this.$store.commit('zread/CLEAR_ZREAD')
          this.$store.commit('wiki/CLEAR_WIKI')
        }
      },
      immediate: true
    }
  },
  created () {
    document.addEventListener('click', this.closeWikiMenu, false)
    this.$nextTick(() => {
      const dragBar = this.$refs.dragBar
      let startX = 0
      let sideBarWidth = +this.sideBarWidth
      let startWidth = sideBarWidth

      this.sideBarViewWidth = sideBarWidth

      const mouseUpHandler = event => {
        document.removeEventListener('mousemove', mouseMoveHandler, false)
        document.removeEventListener('mouseup', mouseUpHandler, false)
        this.$store.dispatch('CHANGE_SIDE_BAR_WIDTH', sideBarWidth < 220 ? 220 : sideBarWidth)
      }

      const mouseMoveHandler = event => {
        const offset = event.clientX - startX
        sideBarWidth = startWidth + offset
        this.sideBarViewWidth = sideBarWidth
      }

      const mouseDownHandler = event => {
        startX = event.clientX
        startWidth = +this.sideBarWidth
        document.addEventListener('mousemove', mouseMoveHandler, false)
        document.addEventListener('mouseup', mouseUpHandler, false)
      }

      dragBar.addEventListener('mousedown', mouseDownHandler, false)
    })
  },
  beforeDestroy () {
    document.removeEventListener('click', this.closeWikiMenu, false)
  },
  methods: {
    handleLeftIconClick (name) {
      if (name === 'ai') {
        // AI icon toggles the right-side AI panel
        this.$store.dispatch('TOGGLE_AI_PANEL')
        return
      }
      if (name === 'wiki') {
        this.showWikiMenu = !this.showWikiMenu
        return
      }
      this.showWikiMenu = false
      if (this.rightColumn === name) {
        this.$store.commit('SET_LAYOUT', { rightColumn: '' })
        this.$store.dispatch('CHANGE_SIDE_BAR_WIDTH', this.finalSideBarWidth)
      } else {
        const needDispatch = this.rightColumn === ''
        this.$store.commit('SET_LAYOUT', { rightColumn: name })
        this.sideBarViewWidth = +this.sideBarWidth
        if (needDispatch) {
          this.$store.dispatch('CHANGE_SIDE_BAR_WIDTH', this.finalSideBarWidth)
        }
      }
    },
    handleLeftBottomClick (name) {
      if (name === 'settings') {
        this.$store.dispatch('OPEN_SETTING_WINDOW')
      }
    },
    wikiText (key, fallback) {
      return this.$te && this.$te(key) ? this.$t(key) : fallback
    },
    isIconActive (name) {
      if (name === 'ai') {
        return this.showAiPanel
      }
      if (name === 'wiki') {
        return this.rightColumn === 'wiki' || this.rightColumn === 'zread' || this.showWikiMenu
      }
      return name === this.rightColumn
    },
    closeWikiMenu () {
      this.showWikiMenu = false
    },
    isWikiVersionActive (sourceName, versionPath) {
      if (sourceName !== this.rightColumn) return false
      if (sourceName === 'wiki') return this.wikiVersionPath === versionPath
      if (sourceName === 'zread') return this.zreadVersionPath === versionPath
      return false
    },
    openWikiVersion (sourceName, versionPath) {
      const rootPath = sourceName === 'wiki' ? this.wikiRootPath : this.zreadRootPath
      if (!rootPath || !versionPath) return

      if (sourceName === 'wiki') {
        this.$store.dispatch('wiki/CHECK_WIKI', { rootPath, versionPath, force: true })
      } else {
        this.$store.dispatch('zread/CHECK_ZREAD', { rootPath, versionPath, force: true })
      }

      const needDispatch = this.rightColumn === ''
      this.$store.commit('SET_LAYOUT', { rightColumn: sourceName })
      this.sideBarViewWidth = +this.sideBarWidth
      if (needDispatch) {
        this.$store.dispatch('CHANGE_SIDE_BAR_WIDTH', this.finalSideBarWidth)
      }
      this.showWikiMenu = false
    }
  }
}
</script>

<style scoped>
  .side-bar {
    display: flex;
    flex-shrink: 0;
    flex-grow: 0;
    width: 280px;
    height: 100%;
    min-width: 220px;
    min-height: 0;
    position: relative;
    color: var(--sideBarColor);
    user-select: none;
    background: var(--sideBarBgColor);
    border-right: 1px solid var(--itemBgColor);
    & .left-column {
      & svg {
        fill: var(--iconColor);
      }
    }
  }

  .left-column {
    height: 100%;
    width: 45px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding-top: 12px;
    box-sizing: border-box;
    position: relative;
    & > ul {
      opacity: 1;
    }
  }

  .left-column ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    & > li {
      width: 45px;
      height: 45px;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: space-around;
      align-items: center;
      cursor: pointer;
      position: relative;
      border-radius: 6px;
      transition: background-color .16s ease, box-shadow .16s ease;
      &:hover {
        background: var(--sideBarItemHoverBgColor);
      }
      &:hover > svg {
        transform: translateY(-1px) scale(1.08);
      }
      & > svg {
        width: 18px;
        height: 18px;
        fill: var(--sideBarIconColor);
        stroke: var(--sideBarIconColor);
        opacity: 1;
        transition: transform .25s ease-in-out;
      }
      &.active > svg {
        fill: var(--themeColor);
        stroke: var(--themeColor);
      }
      &.active:hover {
        background: var(--themeColor10);
      }
    }
  }

  .side-bar:hover .left-column ul li svg {
    opacity: 1;
  }
  .wiki-picker {
    position: absolute;
    top: 192px;
    left: 43px;
    width: 248px;
    max-height: min(420px, calc(100vh - 190px));
    overflow-y: auto;
    padding: 8px;
    z-index: 10;
    color: var(--sideBarColor);
    background: var(--sideBarBgColor);
    border: 1px solid var(--itemBgColor);
    box-shadow: 0 8px 24px rgba(0, 0, 0, .14);
    border-radius: 6px;
    box-sizing: border-box;
  }
  .wiki-picker-title {
    padding: 4px 8px 8px;
    color: var(--sideBarTitleColor);
    font-size: 13px;
    font-weight: 600;
  }
  .wiki-picker-section {
    padding: 6px 0;
    border-top: 1px solid var(--itemBgColor);
  }
  .wiki-picker-section:first-of-type {
    border-top: none;
  }
  .wiki-picker-section-title {
    padding: 2px 8px 6px;
    color: var(--sideBarTextColor);
    font-size: 12px;
  }
  .wiki-picker-item {
    width: 100%;
    min-height: 44px;
    padding: 7px 8px;
    border: 0;
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    color: var(--sideBarColor);
    background: transparent;
    cursor: pointer;
    text-align: left;
  }
  .wiki-picker-item:hover {
    background: var(--sideBarItemHoverBgColor);
  }
  .wiki-picker-item.active {
    color: var(--themeColor);
    background: var(--themeColor10);
  }
  .wiki-picker-version {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
  }
  .wiki-picker-meta {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 11px;
    opacity: .72;
  }
  .wiki-picker-empty {
    padding: 12px 8px;
    color: var(--sideBarTextColor);
    font-size: 12px;
  }
  .right-column {
    flex: 1;
    width: calc(100% - 50px);
    overflow: hidden;
  }
  .drag-bar {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    height: 100%;
    width: 3px;
    cursor: col-resize;
    &:hover {
      border-right: 2px solid var(--iconColor);
    }
  }
</style>
