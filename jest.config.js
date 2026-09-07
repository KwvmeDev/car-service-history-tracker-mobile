// revv-mobile runs on jest-expo + @testing-library/react-native (docs/testing-strategy.md,
// "Runner split", decided Sprint 2). Vitest does not run RN's transform pipeline +
// Reanimated 4 cleanly on Expo SDK 55 / RN 0.82 / React 19.1.
//
// The extra packages appended to transformIgnorePatterns ship untranspiled ESM/Flow and
// must go through babel-jest like the rest of the RN universe.
/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}', '<rootDir>/app/**/*.test.{ts,tsx}'],
  clearMocks: true,
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|react-native-reanimated|react-native-worklets|react-native-gesture-handler|react-native-mmkv|@react-native-google-signin|@tanstack|better-auth|@better-auth|@better-fetch|uuid|nanoid|jose))',
    '/node_modules/react-native-reanimated/plugin/',
  ],
}
