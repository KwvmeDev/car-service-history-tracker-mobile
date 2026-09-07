// revv-mobile runs on jest-expo + @testing-library/react-native (docs/testing-strategy.md,
// "Runner split", decided Sprint 2). Vitest does not run RN's transform pipeline +
// Reanimated 4 cleanly on Expo SDK 55 / RN 0.82 / React 19.1.
//
// better-auth and much of its dependency tree ship ESM as .mjs / untranspiled .js, so
// the transform matches .mjs/.cjs too and those packages are excluded from
// transformIgnorePatterns.
const rnUniverse = [
  '.pnpm',
  'react-native',
  '@react-native',
  '@react-native-community',
  'expo',
  '@expo',
  '@expo-google-fonts',
  'react-navigation',
  '@react-navigation',
  '@sentry/react-native',
  'native-base',
  'react-native-reanimated',
  'react-native-worklets',
  'react-native-gesture-handler',
  'react-native-mmkv',
  '@react-native-google-signin',
  '@tanstack',
  'better-auth',
  '@better-auth',
  '@better-fetch',
  'nanostores',
  'jose',
  '@noble',
  'defu',
  'better-call',
  'uuid',
  'nanoid',
]

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}', '<rootDir>/app/**/*.test.{ts,tsx}'],
  clearMocks: true,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'json', 'node'],
  transform: {
    // better-auth's ESM ships as .mjs, which the jest-expo preset's transform regex
    // ('\\.[jt]sx?$') does not match. .cjs is left alone — it runs natively and
    // transforming it pulls in @babel/runtime helpers no consumer installs.
    '^.+\\.mjs$': 'babel-jest',
  },
  transformIgnorePatterns: [
    `/node_modules/(?!(${rnUniverse.join('|')}))`,
    '/node_modules/react-native-reanimated/plugin/',
  ],
}
