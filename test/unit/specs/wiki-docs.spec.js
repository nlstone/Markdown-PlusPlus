import {
  normalizeWikiVersions,
  transformWikiPagesToTree
} from '../../../src/common/wikiDocs'

describe('Wiki docs helpers', () => {
  it('normalizes wiki versions and marks the selected current version', () => {
    const versions = normalizeWikiVersions([
      { versionPath: '2026-06-01', title: 'June Docs', pageCount: 3 },
      { versionPath: '2026-06-15', pageCount: 7 }
    ], '2026-06-15')

    expect(versions).to.deep.equal([
      {
        versionPath: '2026-06-01',
        title: 'June Docs',
        pageCount: 3,
        isCurrent: false
      },
      {
        versionPath: '2026-06-15',
        title: '2026-06-15',
        pageCount: 7,
        isCurrent: true
      }
    ])
  })

  it('adds the current version when a legacy wiki has no version list yet', () => {
    const versions = normalizeWikiVersions([], 'current-version')

    expect(versions).to.deep.equal([
      {
        versionPath: 'current-version',
        title: 'current-version',
        pageCount: 0,
        isCurrent: true
      }
    ])
  })

  it('builds tree leaf paths for the selected wiki directory prefix', () => {
    const tree = transformWikiPagesToTree([
      {
        title: 'Intro',
        file: 'intro.md',
        section: 'Start',
        level: 'beginner'
      }
    ], 'D:/Project', '2026-06-15', '.md++/wiki')

    expect(tree[0].label).to.equal('Start')
    expect(tree[0].children[0].fullPath).to.equal('D:/Project/.md++/wiki/2026-06-15/intro.md')
  })
})
