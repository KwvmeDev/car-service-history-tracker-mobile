// Babel is used by Metro (app bundling) and by babel-jest via the jest-expo preset.
// The react-native-worklets plugin is what compiles Reanimated 4 worklets — it must be
// listed last (docs/testing-strategy.md, Reanimated 4 upgrade notes).
module.exports = function babelConfig(api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  }
}
