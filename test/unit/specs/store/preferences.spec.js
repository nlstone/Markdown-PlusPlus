import preferencesModule from '../../../../src/renderer/store/preferences'

describe('preferences store module', () => {
  describe('state', () => {
    it('defaults new windows to split preview without source-only mode', () => {
      expect(preferencesModule.state.splitPreview).to.equal(true)
      expect(preferencesModule.state.sourceCode).to.equal(false)
    })
  })
})
