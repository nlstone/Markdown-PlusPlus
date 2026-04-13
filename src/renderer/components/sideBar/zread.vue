<template>
  <div
    class="side-bar-zread"
    :class="[{ 'side-bar-zread-overflow': !wordWrapInToc, 'side-bar-zread-wordwrap': wordWrapInToc }]"
  >
    <div class="title">{{ $t('sidebar.zread') }}</div>
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
      <span class="no-data-text">{{ error || $t('sidebar.emptyProject') }}</span>
    </div>
    <div class="loading" v-else>
      <span>{{ $t('sidebar.loading') || 'Loading...' }}</span>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { ipcRenderer } from 'electron'
import EmptyIcon from '@/assets/icons/undraw_toc_empty.svg'

export default {
  name: 'Zread',
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
    ...mapState('zread', {
      structure: state => state.structure,
      loading: state => state.loading,
      error: state => state.error
    }),
    ...mapState({
      wordWrapInToc: state => state.preferences.wordWrapInToc
    })
  },
  methods: {
    handleClick (data) {
      // Only open file if this is a leaf node (has file property)
      if (data.file && data.fullPath) {
        ipcRenderer.send('mt::open-file', data.fullPath, { preserveSidebar: true })
      }
    }
  }
}
</script>

<style>
  .side-bar-zread {
    height: calc(100% - 35px);
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    & .title {
      color: var(--sideBarTitleColor);
      font-weight: 600;
      font-size: 16px;
      margin: 37px 0 10px 0;
      padding-left: 25px;
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

  .side-bar-zread-overflow {
    overflow: auto;
  }

  .side-bar-zread-wordwrap {
    overflow-x: hidden;
    overflow-y: auto;
    & .el-tree-node__content {
      white-space: normal;
      height: auto;
      min-height: 26px;
    }
  }

  .custom-tree-node {
    display: flex;
    align-items: center;
    width: 100%;
    padding-right: 8px;
  }

  .node-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
