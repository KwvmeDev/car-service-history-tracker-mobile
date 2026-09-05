import tseslint from 'typescript-eslint'

import { revvBase } from './tools/config-base/eslint.config.base.mjs'

export default tseslint.config(
  {
    ignores: [
      '.expo/**',
      'android/**',
      'ios/**',
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'tools/**',
      'scripts/**',
      'src/api/generated/**',
      '*.config.mjs',
      '*.config.js',
      '*.config.ts',
      'expo-env.d.ts',
    ],
  },
  ...revvBase({ tsconfigRootDir: import.meta.dirname }),
)
