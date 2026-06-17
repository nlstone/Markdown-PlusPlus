<template>
  <div
    class="side-bar-wiki"
    :class="[{ 'side-bar-wiki-overflow': !wordWrapInToc, 'side-bar-wiki-wordwrap': wordWrapInToc }]"
  >
    <div class="wiki-header">
      <div class="title">{{ $t('sidebar.wiki') }}</div>
      <div class="wiki-actions" v-if="structure.length">
        <button class="wiki-action-btn" @click="handleExport('html')" :title="$t('wiki.exportHtml')">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
        </button>
        <button class="wiki-action-btn" @click="handleExport('pdf')" :title="$t('wiki.exportPdf')">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path fill="currentColor" d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
          </svg>
        </button>
        <button class="wiki-action-btn" @click="handleRegenerate" :title="$t('wiki.regenerate')">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
      </div>
    </div>
    <el-tree
      v-if="structure.length"
      :data="structure"
      :default-expand-all="true"
      :props="defaultProps"
      @node-click="handleClick"
      :expand-on-click-node="false"
      :indent="10"
    >
      <span class="custom-tree-node" slot-scope="{ node, data }">
        <span class="node-label">{{ node.label }}</span>
      </span>
    </el-tree>
    <div class="no-data" v-else-if="!loading">
      <svg aria-hidden="true" :viewBox="EmptyIcon.viewBox">
        <use :xlink:href="EmptyIcon.url"></use>
      </svg>
      <span class="no-data-text">{{ error || $t('wiki.noWiki') }}</span>
    </div>
    <div class="loading" v-else>
      <span>{{ $t('sidebar.loading') || 'Loading...' }}</span>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { ipcRenderer, shell } from 'electron'
import bus from '@/bus'
import { readAllWikiPages, exportWiki } from '@/services/wikiExporter'
import EmptyIcon from '@/assets/icons/undraw_toc_empty.svg'

export default {
  name: 'Wiki',
  data () {
    this.EmptyIcon = EmptyIcon
    return {
      defaultProps: {
        children: 'children',
        label: 'label'
      }
    }
  },
  computed: {
    ...mapState('wiki', {
      structure: state => state.structure,
      loading: state => state.loading,
      error: state => state.error,
      hasWiki: state => state.hasWiki,
      rootPath: state => state.rootPath,
      versionPath: state => state.versionPath,
      pages: state => state.pages
    }),
    ...mapState({
      wordWrapInToc: state => state.preferences.wordWrapInToc
    })
  },
  created () {
    bus.$on('export-wiki', this.handleExport)
  },
  beforeDestroy () {
    bus.$off('export-wiki', this.handleExport)
  },
  methods: {
    handleClick (data) {
      if (data.file && data.fullPath) {
        ipcRenderer.send('mt::open-file', data.fullPath, { preserveSidebar: true })
      }
    },
    handleRegenerate () {
      bus.$emit('show-wiki-generator')
    },
    async handleExport (format) {
      // Try wiki store first, then zread store
      const wikiState = this.$store.state.wiki
      const zreadState = this.$store.state.zread

      let rootPath, versionPath, pages, wikiDirPrefix, title
      if (wikiState.hasWiki && wikiState.pages.length) {
        rootPath = wikiState.rootPath
        versionPath = wikiState.versionPath
        pages = wikiState.pages
        wikiDirPrefix = '.md++/wiki'
        title = 'Project Wiki'
      } else if (zreadState.hasZread && zreadState.pages.length) {
        rootPath = zreadState.rootPath
        versionPath = zreadState.versionPath
        pages = zreadState.pages
        wikiDirPrefix = '.zread/wiki'
        title = 'ZRead Documentation'
      } else {
        return
      }

      try {
        const { wikiJson, pages: pagesWithContent } = await readAllWikiPages({
          rootPath, versionPath, wikiDirPrefix, pages
        })
        const result = await exportWiki(format, { title: wikiJson.title || title, pages: pagesWithContent })
        if (result && result.filePath) {
          shell.showItemInFolder(result.filePath)
        }
      } catch (err) {
        console.error('[Wiki] Export failed:', err)
      }
    }
  }
}
</script>

<style>
  .side-bar-wiki {
    height: calc(100% - 35px);
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    & .wiki-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-right: 15px;
      margin: 37px 0 10px 0;
    }
    & .title {
      color: var(--sideBarTitleColor);
      font-weight: 600;
      font-size: 16px;
      padding-left: 25px;
    }
    & .wiki-actions {
      display: flex;
      gap: 4px;
    }
    & .wiki-action-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      color: var(--iconColor);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    & .wiki-action-btn:hover {
      background: var(--itemBgColor);
      color: var(--sideBarColor);
    }
    & .el-tree-node {
      margin-top: 8px;
    }
    & .el-tree {
      background: transparent;
      color: var(--sideBarColor);
    }
    & .el-tree-node:focus > .el-tree-node__content {
      background-color: var(--sideBarItemHoverBgColor);
    }
    & .el-tree-node__content:hover {
      background: var(--sideBarItemHoverBgColor);
    }
    & > li {
      font-size: 14px;
      margin-bottom: 15px;
      cursor: pointer;
    }
    & .no-data {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-around;
      padding-bottom: 50px;
      & svg {
        width: 120px;
        fill: var(--themeColor);
      }
      & .no-data-text {
        color: var(--sideBarColor);
        opacity: 0.6;
        font-size: 14px;
        margin-top: 10px;
      }
    }
    & .loading {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--sideBarColor);
      opacity: 0.6;
    }
  }

  .side-bar-wiki-overflow {
    overflow: auto;
  }

  .side-bar-wiki-wordwrap {
    overflow-x: hidden;
    overflow-y: auto;
    & .el-tree-node__content {
      white-space: normal;
      height: auto;
      min-height: 26px;
    }
  }
</style>
