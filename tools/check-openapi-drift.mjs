#!/usr/bin/env node
/**
 * check-openapi-drift.mjs — fail if a consumer repo's generated API client is
 * stale relative to the API contract it pinned.
 *
 * Contract sharing is generate-not-author (ADR 0005). A consumer commits:
 *   - openapi/revv-api.json        the exact spec it generated against
 *   - src/api/generated/**         the generated client + types
 *   - openapi/.spec-hash           sha256 of openapi/revv-api.json at generation time
 *
 * This script recomputes the hash and compares. A mismatch means someone edited
 * the spec or the client without running `npm run client:generate`.
 *
 * Usage:  node check-openapi-drift.mjs <consumer-repo-path>
 * Exit:   0 = in sync, 1 = drift, 2 = bad invocation / missing files
 *
 * Zero dependencies. Node 22+.
 */

import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

const repoPath = process.argv[2]
if (!repoPath) {
  console.error('usage: node check-openapi-drift.mjs <consumer-repo-path>')
  process.exit(2)
}

const specPath = join(repoPath, 'openapi', 'revv-api.json')
const hashPath = join(repoPath, 'openapi', '.spec-hash')

for (const p of [specPath, hashPath]) {
  if (!existsSync(p)) {
    console.error(`check-openapi-drift: missing ${p}`)
    console.error('This repo does not look set up for OpenAPI codegen yet. See ADR 0005.')
    process.exit(2)
  }
}

const specRaw = await readFile(specPath, 'utf8')

// Normalize: parse + stringify with sorted keys so formatting churn is not "drift".
const normalized = JSON.stringify(sortKeys(JSON.parse(specRaw)))
const actual = createHash('sha256').update(normalized).digest('hex')
const recorded = (await readFile(hashPath, 'utf8')).trim()

if (actual === recorded) {
  console.log('check-openapi-drift: in sync — generated client matches the pinned spec')
  process.exit(0)
}

console.error('check-openapi-drift: DRIFT\n')
console.error(`  recorded spec hash : ${recorded}`)
console.error(`  current  spec hash : ${actual}`)
console.error('\nThe committed spec changed but the client was not regenerated (or vice versa).')
console.error('Run:  npm run client:generate   then commit src/api/generated/** and openapi/.spec-hash')
console.error('Contract-change workflow: Revv/skills/revv-api-contract/SKILL.md')
process.exit(1)

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, sortKeys(value[k])]),
    )
  }
  return value
}
