/**
 * Wiki Generator Vuex Store Module
 *
 * Handles detection of .md++ wiki docs and wiki generation state.
 * Uses the same format as ZRead (.zread) for compatibility.
 */

import { ipcRenderer } from 'electron'

const state = {
  hasWiki: false,
  rootPath: null,
  versionPath: null,
  structure: [],
  pages: [],
  loading: false,
  error: null,
  // Generation state
  generating: false,
  progress: { current: 0, total: 0, currentPage: '' },
  generateError: null
}

const mutations = {
  SET_WIKI_STATE (state, payload) {
    Object.assign(state, payload)
  },
  SET_WIKI_STRUCTURE (state, structure) {
    state.structure = structure
  },
  SET_WIKI_LOADING (state, loading) {
    state.loading = loading
  },
  SET_WIKI_ERROR (state, error) {
    state.error = error
  },
  CLEAR_WIKI (state) {
    state.hasWiki = false
    state.rootPath = null
    state.versionPath = null
    state.structure = []
    state.pages = []
    state.loading = false
    state.error = null
  },
  SET_GENERATING (state, generating) {
    state.generating = generating
  },
  SET_PROGRESS (state, progress) {
    state.progress = progress
  },
  SET_GENERATE_ERROR (state, error) {
    state.generateError = error
  }
}

/**
 * Transform flat pages array to hierarchical tree structure
 * Structure: section -> group -> page
 */
function transformToTree (pages, rootPath, versionPath) {
  const sectionsMap = {}

  for (const page of pages) {
    const sectionName = page.section || '未分类'
    const groupName = page.group

    if (!sectionsMap[sectionName]) {
      sectionsMap[sectionName] = {
        label: sectionName,
        children: {}
      }
    }

    const sectionNode = sectionsMap[sectionName]

    if (!groupName) {
      sectionNode.children[page.title] = {
        label: page.title,
        file: page.file,
        fullPath: `${rootPath}/.md++/wiki/${versionPath}/${page.file}`,
        level: page.level,
        isLeaf: true
      }
    } else {
      if (!sectionNode.children[groupName]) {
        sectionNode.children[groupName] = {
          label: groupName,
          children: {}
        }
      }
      sectionNode.children[groupName].children[page.title] = {
        label: page.title,
        file: page.file,
        fullPath: `${rootPath}/.md++/wiki/${versionPath}/${page.file}`,
        level: page.level,
        isLeaf: true
      }
    }
  }

  return Object.values(sectionsMap).map(section => ({
    label: section.label,
    children: Object.values(section.children).map(item => {
      if (item.isLeaf) return item
      return {
        label: item.label,
        children: Object.values(item.children)
      }
    })
  }))
}

const actions = {
  /**
   * Check if .md++ directory exists and load structure
   * @param {string|{rootPath: string, force?: boolean}} payload - Root path or options object
   */
  CHECK_WIKI ({ commit, state }, payload) {
    const rootPath = typeof payload === 'string' ? payload : payload?.rootPath
    const force = typeof payload === 'object' ? !!payload?.force : false

    if (!rootPath) {
      commit('CLEAR_WIKI')
      return
    }

    if (!force && state.rootPath === rootPath && state.hasWiki) {
      return
    }

    commit('SET_WIKI_LOADING', true)
    commit('SET_WIKI_ERROR', null)

    ipcRenderer.send('mt::check-wiki', rootPath)
  },

  /**
   * Handle wiki check result from main process
   */
  HANDLE_WIKI_RESULT ({ commit, state }, result) {
    if (!result || !result.hasWiki) {
      commit('CLEAR_WIKI')
      return
    }

    commit('SET_WIKI_STATE', {
      hasWiki: true,
      rootPath: result.rootPath,
      versionPath: result.versionPath,
      pages: result.pages || []
    })

    if (result.pages && result.pages.length > 0) {
      const structure = transformToTree(result.pages, result.rootPath, result.versionPath)
      commit('SET_WIKI_STRUCTURE', structure)
    }

    commit('SET_WIKI_LOADING', false)
  },

  /**
   * Handle wiki error
   */
  HANDLE_WIKI_ERROR ({ commit }, error) {
    commit('SET_WIKI_LOADING', false)
    commit('SET_WIKI_ERROR', error)
    commit('SET_WIKI_STATE', { hasWiki: false })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
