import { ipcRenderer } from 'electron'
import bus from '../bus'

const width = localStorage.getItem('side-bar-width')
const sideBarWidth = typeof +width === 'number' ? Math.max(+width, 220) : 280
const aiWidth = localStorage.getItem('ai-panel-width')
const aiPanelWidth = typeof +aiWidth === 'number' ? Math.max(200, Math.min(600, +aiWidth)) : 320

// messages from main process, and do not change the state
const state = {
  rightColumn: 'files',
  showSideBar: false,
  showTabBar: false,
  sideBarWidth,
  showAiPanel: false,
  aiPanelWidth
}

const getters = {}

const mutations = {
  SET_LAYOUT (state, layout) {
    if (layout.showSideBar !== undefined) {
      const { windowId } = global.markdownpp.env
      ipcRenderer.send('mt::update-sidebar-menu', windowId, !!layout.showSideBar)
    }
    Object.assign(state, layout)
  },
  TOGGLE_LAYOUT_ENTRY (state, entryName) {
    state[entryName] = !state[entryName]
  },
  SET_SIDE_BAR_WIDTH (state, width) {
    // TODO: Add side bar to session (GH#732).
    localStorage.setItem('side-bar-width', Math.max(+width, 220))
    state.sideBarWidth = width
  },
  SET_AI_PANEL (state, payload) {
    if (payload.showAiPanel !== undefined) {
      state.showAiPanel = payload.showAiPanel
    }
    if (payload.aiPanelWidth !== undefined) {
      state.aiPanelWidth = payload.aiPanelWidth
    }
  }
}

const actions = {
  LISTEN_FOR_LAYOUT ({ state, commit, dispatch }) {
    ipcRenderer.on('mt::set-view-layout', (e, layout) => {
      if (layout.rightColumn) {
        commit('SET_LAYOUT', {
          ...layout,
          rightColumn: layout.rightColumn === state.rightColumn ? '' : layout.rightColumn,
          showSideBar: true
        })
      } else {
        commit('SET_LAYOUT', layout)
      }
      dispatch('DISPATCH_LAYOUT_MENU_ITEMS')
    })

    ipcRenderer.on('mt::toggle-view-layout-entry', (event, entryName) => {
      commit('TOGGLE_LAYOUT_ENTRY', entryName)
      dispatch('DISPATCH_LAYOUT_MENU_ITEMS')
    })

    bus.$on('view:toggle-layout-entry', entryName => {
      commit('TOGGLE_LAYOUT_ENTRY', entryName)
      const { windowId } = global.markdownpp.env
      ipcRenderer.send('mt::view-layout-changed', windowId, { [entryName]: state[entryName] })
    })

    bus.$on('view:toggle-ai-panel', () => {
      commit('SET_AI_PANEL', { showAiPanel: !state.showAiPanel })
    })

    ipcRenderer.on('mt::toggle-ai-panel', () => {
      commit('SET_AI_PANEL', { showAiPanel: !state.showAiPanel })
    })
  },

  DISPATCH_LAYOUT_MENU_ITEMS ({ state }) {
    const { windowId } = global.markdownpp.env
    const { showTabBar, showSideBar } = state
    ipcRenderer.send('mt::view-layout-changed', windowId, { showTabBar, showSideBar })
  },

  CHANGE_SIDE_BAR_WIDTH ({ commit }, width) {
    commit('SET_SIDE_BAR_WIDTH', width)
  },

  TOGGLE_AI_PANEL ({ commit, state }) {
    commit('SET_AI_PANEL', { showAiPanel: !state.showAiPanel })
  },

  SET_AI_PANEL_WIDTH ({ commit }, width) {
    localStorage.setItem('ai-panel-width', width)
    commit('SET_AI_PANEL', { aiPanelWidth: width })
  }
}

export default { state, getters, mutations, actions }
