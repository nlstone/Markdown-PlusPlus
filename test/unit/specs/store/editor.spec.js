import editorModule from '../../../../src/renderer/store/editor'

const { actions, mutations } = editorModule

describe('editor store module', () => {
  describe('LISTEN_FOR_CONTENT_CHANGE', () => {
    it('does not mark a saved tab dirty when only trailing newline normalization changes', () => {
      const tab = {
        id: 'tab-1',
        filename: 'note.md',
        pathname: 'D:/docs/note.md',
        markdown: 'hello',
        isSaved: true,
        trimTrailingNewline: 1,
        cursor: null,
        history: null
      }
      const state = {
        currentFile: tab,
        tabs: [tab],
        listToc: []
      }
      const rootState = {
        preferences: {
          autoSave: false
        }
      }
      const commits = []
      const commit = (name, payload) => {
        commits.push({ name, payload })
        mutations[name](state, payload)
      }

      actions.LISTEN_FOR_CONTENT_CHANGE({
        commit,
        dispatch: () => {},
        state,
        rootState
      }, {
        id: 'tab-1',
        markdown: 'hello\n'
      })

      expect(state.currentFile.markdown).to.equal('hello\n')
      expect(state.currentFile.isSaved).to.equal(true)
      expect(commits.some(item => item.name === 'SET_SAVE_STATUS' && item.payload === false)).to.equal(false)
    })
  })
})
