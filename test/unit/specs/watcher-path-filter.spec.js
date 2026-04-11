import { shouldIgnoreWatcherPath } from '../../../src/common/filesystem/paths'

describe('shouldIgnoreWatcherPath', () => {
  const directoryInfo = {
    isDirectory: () => true
  }

  const fileInfo = {
    isDirectory: () => false
  }

  it('does not ignore the .zread directory', () => {
    expect(shouldIgnoreWatcherPath('D:/Projects/marktext/.zread', directoryInfo)).to.equal(false)
  })

  it('does not ignore markdown files inside .zread', () => {
    expect(shouldIgnoreWatcherPath('D:/Projects/marktext/.zread/wiki/versions/2026-04-09-122900/file.md', fileInfo)).to.equal(false)
  })

  it('continues to ignore other hidden directories', () => {
    expect(shouldIgnoreWatcherPath('D:/Projects/marktext/.git/config', fileInfo)).to.equal(true)
  })

  it('continues to ignore node_modules', () => {
    expect(shouldIgnoreWatcherPath('D:/Projects/marktext/node_modules/pkg/index.md', fileInfo)).to.equal(true)
  })

  it('ignores non-markdown files in visible directories', () => {
    expect(shouldIgnoreWatcherPath('D:/Projects/marktext/docs/schema.json', fileInfo)).to.equal(true)
  })
})
