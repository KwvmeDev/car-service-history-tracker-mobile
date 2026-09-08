// Metro bundles both native and web. `@revv/tokens` is installed as a `file:` link to
// the sibling repo (ADR 0005 — publish is Sprint 0 task 05, pending), so Metro must be
// told to watch that folder and to resolve its dependencies from this project.
// Remove the watchFolders entry once `@revv/tokens` is a published dependency.
const path = require('node:path')
const { getDefaultConfig } = require('expo/metro-config')

const projectRoot = __dirname
const tokensRoot = path.resolve(projectRoot, '../revv-tokens')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [tokensRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(tokensRoot, 'node_modules'),
]
config.resolver.unstable_enableSymlinks = true

module.exports = config
