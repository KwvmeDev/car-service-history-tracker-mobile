import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

// Sprint 0 tests cover the useHealth hook's state machine only (testing-strategy.md).
// @testing-library/react-native's renderHook runs on react-test-renderer, no DOM needed.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
})
