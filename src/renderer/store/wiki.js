/**
 * Wiki Generator Vuex Store Module
 *
 * Handles detection of .md++ wiki docs and wiki generation state.
 * Uses the same format as ZRead (.zread) for compatibility.
 */

import { ipcRenderer } from 'electron'
import { normalizeWikiVersions, transformWikiPagesToTree } from 'common/wikiDocs'

const state = {
  hasWiki: false,
  rootPath: null,
  versionPath: null,
  versions: [],
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
    state.versions = []
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

const actions = {
  /**
   * Check if .md++ directory exists and load structure
   * @param {string|{rootPath: string, force?: boolean}} payload - Root path or options object
   */
  CHECK_WIKI ({ commit, state }, payload) {
    const rootPath = typeof payload === 'string' ? payload : payload?.rootPath
    const versionPath = typeof payload === 'object' ? payload?.versionPath : null
    const force = typeof payload === 'object' ? !!payload?.force : false

    if (!rootPath) {
      commit('CLEAR_WIKI')
      return
    }

    if (!force && state.rootPath === rootPath && state.hasWiki && (!versionPath || state.versionPath === versionPath)) {
      return
    }

    commit('SET_WIKI_LOADING', true)
    commit('SET_WIKI_ERROR', null)

    ipcRenderer.send('mt::check-wiki', { rootPath, versionPath })
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
      versions: normalizeWikiVersions(result.versions || [], result.currentVersionPath || result.versionPath),
      pages: result.pages || []
    })

    if (result.pages && result.pages.length > 0) {
      const structure = transformWikiPagesToTree(result.pages, result.rootPath, result.versionPath, '.md++/wiki')
      commit('SET_WIKI_STRUCTURE', structure)
    } else {
      commit('SET_WIKI_STRUCTURE', [])
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
