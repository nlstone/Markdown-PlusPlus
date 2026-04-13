/**
 * ZRead Vuex Store Module
 *
 * Handles detection and loading of ZRead documentation structure.
 * ZRead docs are stored in .zread/wiki/ directory.
 */

import { ipcRenderer } from 'electron'

const state = {
  hasZread: false,
  rootPath: null,
  versionPath: null,
  structure: [],
  pages: [],
  loading: false,
  error: null
}

const mutations = {
  SET_ZREAD_STATE (state, payload) {
    Object.assign(state, payload)
  },
  SET_ZREAD_STRUCTURE (state, structure) {
    state.structure = structure
  },
  SET_ZREAD_LOADING (state, loading) {
    state.loading = loading
  },
  SET_ZREAD_ERROR (state, error) {
    state.error = error
  },
  CLEAR_ZREAD (state) {
    state.hasZread = false
    state.rootPath = null
    state.versionPath = null
    state.structure = []
    state.pages = []
    state.loading = false
    state.error = null
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

    // Create section if not exists
    if (!sectionsMap[sectionName]) {
      sectionsMap[sectionName] = {
        label: sectionName,
        children: {}
      }
    }

    const sectionNode = sectionsMap[sectionName]

    if (!groupName) {
      // No group, add directly to section as a leaf
      sectionNode.children[page.title] = {
        label: page.title,
        file: page.file,
        fullPath: `${rootPath}/.zread/wiki/${versionPath}/${page.file}`,
        level: page.level,
        isLeaf: true
      }
    } else {
      // Has group, add to group under section
      if (!sectionNode.children[groupName]) {
        sectionNode.children[groupName] = {
          label: groupName,
          children: {}
        }
      }
      sectionNode.children[groupName].children[page.title] = {
        label: page.title,
        file: page.file,
        fullPath: `${rootPath}/.zread/wiki/${versionPath}/${page.file}`,
        level: page.level,
        isLeaf: true
      }
    }
  }

  // Convert maps to arrays for el-tree
  const result = Object.values(sectionsMap).map(section => ({
    label: section.label,
    children: Object.values(section.children).map(item => {
      if (item.isLeaf) {
        // Direct leaf under section
        return item
      } else {
        // Group node with children
        return {
          label: item.label,
          children: Object.values(item.children)
        }
      }
    })
  }))

  return result
}

const actions = {
  /**
   * Check if .zread directory exists and load structure
   */
  CHECK_ZREAD ({ commit, state }, rootPath) {
    if (!rootPath) {
      commit('CLEAR_ZREAD')
      return
    }

    // Skip if already checking same path
    if (state.rootPath === rootPath && state.hasZread) {
      return
    }

    commit('SET_ZREAD_LOADING', true)
    commit('SET_ZREAD_ERROR', null)

    // Request main process to check and load zread
    ipcRenderer.send('mt::check-zread', rootPath)
  },

  /**
   * Handle zread check result from main process
   */
  HANDLE_ZREAD_RESULT ({ commit, state }, result) {
    if (!result || !result.hasZread) {
      commit('CLEAR_ZREAD')
      return
    }

    commit('SET_ZREAD_STATE', {
      hasZread: true,
      rootPath: result.rootPath,
      versionPath: result.versionPath,
      pages: result.pages || []
    })

    if (result.pages && result.pages.length > 0) {
      const structure = transformToTree(result.pages, result.rootPath, result.versionPath)
      commit('SET_ZREAD_STRUCTURE', structure)
    }

    commit('SET_ZREAD_LOADING', false)
  },

  /**
   * Handle zread error
   */
  HANDLE_ZREAD_ERROR ({ commit }, error) {
    commit('SET_ZREAD_LOADING', false)
    commit('SET_ZREAD_ERROR', error)
    commit('SET_ZREAD_STATE', { hasZread: false })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
