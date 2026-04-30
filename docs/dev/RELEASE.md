# Steps to release MarkDown++

- Create a release candidate
  - Create branch `release-v%version%`
  - Set environment variable `MARKDOWNPP_IS_STABLE` to `1` (default on AppVeyor and Travis CI)
  - Ensure [changelog](https://github.com/nlstone/Markdown-PlusPlus/blob/develop/.github/CHANGELOG.md) is up-to-date
  - Bump version in `package.json` and changelog
  - Update all `README.md` files
  - Bump Flathub version ([markdownpp.appdata.xml](https://github.com/nlstone/Markdown-PlusPlus/blob/develop/resources/linux/markdownpp.appdata.xml))
  - Create commit `release version %version%`
  - Ensure all tests pass
  - A new draft release should be available or create one
- Publish GitHub release
  - Add git tag `v%version%`
  - Add changelog
  - Add SHA256 checksums
- Update website and documentation
- Publish [Flathub package](https://github.com/flathub/com.github.markdownpp.markdownpp)
  - Ensure native dependencies
  - Update `runtime` and `SDK` if needed
  - Bump version and update URLs
  - Test the package (`scripts/build-bundle.sh && scripts/test-markdownpp.sh`)
  - Create commit `Update to v%version%`

## Work after releasing

- Ensure all issues in the changelog are closed
- :relaxed: :tada:
