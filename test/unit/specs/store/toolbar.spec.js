import toolbarModule from '../../../../src/renderer/store/toolbar'

const { state: initialStateFactory, mutations } = toolbarModule
const { SET_TOOLBAR_VISIBILITY, SET_FULLSCREEN_STATE } = mutations

describe('toolbar store module', () => {
  let state

  beforeEach(() => {
    // Create a fresh copy of state for each test
    state = { ...initialStateFactory }
  })

  describe('state', () => {
    it('should have showToolbar set to true by default', () => {
      expect(state.showToolbar).to.equal(true)
    })

    it('should have isFullscreen set to false by default', () => {
      expect(state.isFullscreen).to.equal(false)
    })
  })

  describe('mutations', () => {
    describe('SET_TOOLBAR_VISIBILITY', () => {
      it('should set showToolbar to false', () => {
        SET_TOOLBAR_VISIBILITY(state, false)
        expect(state.showToolbar).to.equal(false)
      })

      it('should set showToolbar to true', () => {
        state.showToolbar = false
        SET_TOOLBAR_VISIBILITY(state, true)
        expect(state.showToolbar).to.equal(true)
      })
    })

    describe('SET_FULLSCREEN_STATE', () => {
      it('should set isFullscreen to true', () => {
        SET_FULLSCREEN_STATE(state, true)
        expect(state.isFullscreen).to.equal(true)
      })

      it('should set isFullscreen to false', () => {
        state.isFullscreen = true
        SET_FULLSCREEN_STATE(state, false)
        expect(state.isFullscreen).to.equal(false)
      })
    })
  })
})
