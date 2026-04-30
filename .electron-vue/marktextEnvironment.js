const { GitRevisionPlugin } = require('git-revision-webpack-plugin')
const { version } = require('../package.json')

const getEnvironmentDefinitions = function () {
  let shortHash = 'N/A'
  let fullHash = 'N/A'
  try {
    const gitRevisionPlugin = new GitRevisionPlugin()
    shortHash = gitRevisionPlugin.version()
    fullHash = gitRevisionPlugin.commithash()
  } catch(_) {
    // Ignore error if we build without git.
  }

  const isStableRelease = !!process.env.MARKDOWNPP_IS_STABLE
  const versionSuffix = isStableRelease ? '' : ` (${shortHash})`
  return {
    'global.MARKDOWNPP_GIT_SHORT_HASH': JSON.stringify(shortHash),
    'global.MARKDOWNPP_GIT_HASH': JSON.stringify(fullHash),

    'global.MARKDOWNPP_VERSION': JSON.stringify(version),
    'global.MARKDOWNPP_VERSION_STRING': JSON.stringify(`v${version}${versionSuffix}`),
    'global.MARKDOWNPP_IS_STABLE': JSON.stringify(isStableRelease)
  }
}

const getRendererEnvironmentDefinitions = function () {
  const env = getEnvironmentDefinitions()
  return {
    'process.versions.MARKDOWNPP_VERSION': env['global.MARKDOWNPP_VERSION'],
    'process.versions.MARKDOWNPP_VERSION_STRING': env['global.MARKDOWNPP_VERSION_STRING'],
  }
}

module.exports = {
  getEnvironmentDefinitions: getEnvironmentDefinitions,
  getRendererEnvironmentDefinitions: getRendererEnvironmentDefinitions
}
