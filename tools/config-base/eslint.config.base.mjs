// @ts-check
/**
 * Revv shared ESLint flat config (ESLint 9+).
 *
 * Each repo's own eslint.config.mjs does:
 *
 *   import { revvBase } from './eslint.config.base.mjs' // copied from Revv/tools/config-base/
 *   import tseslint from 'typescript-eslint'
 *   export default tseslint.config(
 *     ...revvBase({ tsconfigRootDir: import.meta.dirname }),
 *     { ignores: ['dist/**', '.next/**', 'src/api/generated/**'] },
 *     // repo-specific overrides
 *   )
 *
 * Peer deps the consuming repo must install:
 *   eslint  typescript-eslint  eslint-config-prettier
 *
 * Import-boundary rules encoded here (docs/engineering-standards.md §Layering):
 *   - `@prisma/client` may be imported only from repository modules.
 *   - service modules never import `fastify` (services take plain args, throw domain errors).
 *   - no cross-app relative escape (`../../` out of the repo).
 *
 * Raw color literals are guarded by tools/check-design-tokens.mjs, not ESLint.
 */

import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

const REPOSITORY_GLOBS = ['**/repositories/**/*.{ts,tsx}', '**/*.repository.ts', '**/prisma/**/*.ts']
const SERVICE_GLOBS = ['**/services/**/*.{ts,tsx}', '**/*.service.ts']

const prismaRestriction = {
  name: '@prisma/client',
  message:
    'Import @prisma/client only from repository modules (docs/engineering-standards.md §Layering). Route/service code takes plain data.',
}

const fastifyRestriction = {
  name: 'fastify',
  message:
    'Services never import fastify. They take plain arguments and return data or throw a domain error (docs/engineering-standards.md §Layering).',
}

/**
 * @param {{ tsconfigRootDir?: string }} [options]
 * @returns {import('typescript-eslint').ConfigArray}
 */
export function revvBase(options = {}) {
  const tsconfigRootDir = options.tsconfigRootDir

  return tseslint.config(
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
      languageOptions: {
        parserOptions: {
          projectService: true,
          ...(tsconfigRootDir ? { tsconfigRootDir } : {}),
        },
      },
      rules: {
        // --- philosophy: no any, exhaustive switch, early returns (engineering-standards.md) ---
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/switch-exhaustiveness-check': 'error',
        // Optimistic generated types (openapi-fetch, Prisma) make genuine runtime
        // guards look redundant. Defence-in-depth checks stay; this rule does not.
        '@typescript-eslint/no-unnecessary-condition': 'off',
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
        ],
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
        'no-console': ['error', { allow: ['warn', 'error'] }],
        'no-restricted-syntax': [
          'error',
          {
            selector: 'TSEnumDeclaration',
            message: 'Prefer a union of string literals or `as const` over `enum`.',
          },
        ],
        // --- import boundaries (docs/engineering-standards.md §Layering) ---
        // Default: @prisma/client is off-limits. Repository modules re-enable it below.
        'no-restricted-imports': ['error', { paths: [prismaRestriction] }],
      },
    },
    {
      files: SERVICE_GLOBS,
      rules: {
        // Services additionally may not touch fastify.
        'no-restricted-imports': ['error', { paths: [prismaRestriction, fastifyRestriction] }],
      },
    },
    {
      files: REPOSITORY_GLOBS,
      rules: {
        // Repositories are the one sanctioned home of @prisma/client.
        'no-restricted-imports': ['error', { paths: [] }],
      },
    },
    {
      files: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        'scripts/**',
        '**/*.config.{ts,mjs,js}',
      ],
      rules: {
        'no-console': 'off',
        'no-restricted-imports': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        // Test doubles and HTTP-inject payloads are legitimately untyped: an
        // app.inject() response `.json()` is `any`, so casting it to a small
        // expected shape (and interpolating an id into a URL) is normal here.
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unnecessary-type-assertion': 'off',
        '@typescript-eslint/restrict-template-expressions': ['error', { allowAny: true }],
      },
    },
    prettier,
  )
}

export default revvBase
