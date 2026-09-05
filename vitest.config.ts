import { defineConfig } from 'vitest/config'

// Hooks and pure functions only in Sprint 0 (testing-strategy.md). react-native is
// aliased to react-native-web so component/hook rendering works under jsdom without a
// native runtime.
export default defineConfig({
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
  },
})
