import { ipcRenderer } from 'electron'

const state = {
  showToolbar: true,
  isFullscreen: false
}

const getters = {}

const mutations = {
  SET_TOOLBAR_VISIBILITY (state, visible) {
    state.showToolbar = visible
  },
  SET_FULLSCREEN_STATE (state, isFullscreen) {
    state.isFullscreen = isFullscreen
  }
}

const actions = {
  LISTEN_FOR_TOOLBAR ({ commit, state }) {
    ipcRenderer.on('mt::toggle-view-layout-entry', (e, entryName) => {
      if (entryName === 'showToolbar') {
        const newValue = !state.showToolbar
        commit('SET_TOOLBAR_VISIBILITY', newValue)
        const { windowId } = global.marktext.env
        ipcRenderer.send('mt::view-layout-changed', windowId, { showToolbar: newValue })
      }
    })
  }
}

export default { state, getters, mutations, actions }
