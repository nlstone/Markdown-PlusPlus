/**
 * ZRead Vuex Store Module
 *
 * Handles detection and loading of ZRead documentation structure.
 * ZRead docs are stored in .zread/wiki/ directory.
 */

import { ipcRenderer } from 'electron'
import { normalizeWikiVersions, transformWikiPagesToTree } from 'common/wikiDocs'

const state = {
  hasZread: false,
  rootPath: null,
  versionPath: null,
  versions: [],
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
    state.versions = []
    state.structure = []
    state.pages = []
    state.loading = false
    state.error = null
  }
}

const actions = {
  /**
   * Check if .zread directory exists and load structure
   */
  CHECK_ZREAD ({ commit, state }, payload) {
    const rootPath = typeof payload === 'string' ? payload : payload?.rootPath
    const versionPath = typeof payload === 'object' ? payload?.versionPath : null
    const force = typeof payload === 'object' ? !!payload?.force : false

    if (!rootPath) {
      commit('CLEAR_ZREAD')
      return
    }

    // Skip if already checking same path
    if (!force && state.rootPath === rootPath && state.hasZread && (!versionPath || state.versionPath === versionPath)) {
      return
    }

    commit('SET_ZREAD_LOADING', true)
    commit('SET_ZREAD_ERROR', null)

    // Request main process to check and load zread
    ipcRenderer.send('mt::check-zread', { rootPath, versionPath })
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
      versions: normalizeWikiVersions(result.versions || [], result.currentVersionPath || result.versionPath),
      pages: result.pages || []
    })

    if (result.pages && result.pages.length > 0) {
      const structure = transformWikiPagesToTree(result.pages, result.rootPath, result.versionPath, '.zread/wiki')
      commit('SET_ZREAD_STRUCTURE', structure)
    } else {
      commit('SET_ZREAD_STRUCTURE', [])
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
