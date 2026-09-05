#!/usr/bin/env node
/**
 * verify-foundation.mjs — check a Revv repo against the shared foundation.
 *
 * Verifies:
 *   1. The verbatim-copy config files (.editorconfig, .prettierrc, .nvmrc) exist in
 *      the repo and are byte-identical (after trim) to Revv/tools/config-base/.
 *   2. .nvmrc pins Node 22.x.
 *   3. tsconfig.json `extends` the shared base and does not weaken `strict` or
 *      `noUncheckedIndexedAccess`.
 *   4. A code repo (one with a package.json) has a non-empty .claude/agents/ directory.
 *
 * Usage:  node verify-foundation.mjs <repo-path>
 * Exit:   0 = ok, 1 = problems, 2 = bad invocation
 *
 * Zero dependencies. Node 22+.
 */

import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoPath = process.argv[2]
if (!repoPath) {
  console.error('usage: node verify-foundation.mjs <repo-path>')
  process.exit(2)
}
if (!existsSync(repoPath)) {
  console.error(`verify-foundation: no such path: ${repoPath}`)
  process.exit(2)
}

const hubToolsDir = dirname(fileURLToPath(import.meta.url))
const baseDir = join(hubToolsDir, 'config-base')

const problems = []
const notes = []

// --- 1 + 2. verbatim-copy config files ------------------------------------------------
const VERBATIM = ['.editorconfig', '.prettierrc', '.nvmrc']

if (!existsSync(baseDir)) {
  problems.push(`config-base/ is missing at ${baseDir} — the hub itself is broken`)
} else {
  for (const name of VERBATIM) {
    const basePath = join(baseDir, name)
    const repoFile = join(repoPath, name)
    if (!existsSync(basePath)) {
      problems.push(`config-base/${name} is missing in the hub — cannot verify ${name}`)
      continue
    }
    if (!existsSync(repoFile)) {
      problems.push(`missing ${name} (copy it verbatim from Revv/tools/config-base/${name})`)
      continue
    }
    const [a, b] = await Promise.all([readFile(basePath, 'utf8'), readFile(repoFile, 'utf8')])
    if (a.trim() !== b.trim()) {
      problems.push(
        `${name} has drifted from Revv/tools/config-base/${name} — re-copy it, do not fork it`,
      )
    }
  }
}

// --- 2. Node pin ---------------------------------------------------------------------
const nvmrc = join(repoPath, '.nvmrc')
if (existsSync(nvmrc)) {
  const v = (await readFile(nvmrc, 'utf8')).trim().replace(/^v/, '')
  if (!/^22(\.|$)/.test(v)) problems.push(`.nvmrc pins Node ${v}, expected 22.x`)
} else {
  problems.push('missing .nvmrc (expected content: 22)')
}

// --- 3. tsconfig extends the base + keeps strictness --------------------------------
const tsconfigPath = join(repoPath, 'tsconfig.json')
if (!existsSync(tsconfigPath)) {
  problems.push('missing tsconfig.json (must extend Revv/tools/config-base/tsconfig.base.json)')
} else {
  const raw = await readFile(tsconfigPath, 'utf8')
  let json
  try {
    json = JSON.parse(stripJsonComments(raw))
  } catch {
    problems.push('tsconfig.json is not parseable')
  }
  if (json) {
    const co = json.compilerOptions ?? {}
    const extendsList = Array.isArray(json.extends)
      ? json.extends
      : typeof json.extends === 'string'
        ? [json.extends]
        : []
    const extendsBase = extendsList.some((e) => typeof e === 'string' && e.includes('base'))

    if (!extendsBase) {
      problems.push(
        'tsconfig.json does not extend the shared base (expected "extends" to reference tsconfig.base.json)',
      )
    }
    if (co.strict === false) problems.push('tsconfig.json weakens the base: strict is false')
    if (co.noUncheckedIndexedAccess === false) {
      problems.push('tsconfig.json weakens the base: noUncheckedIndexedAccess is false')
    }
    if (!extendsBase && co.strict !== true) {
      problems.push('tsconfig.json: strict is not true and it does not extend the base')
    }
  }
}

// --- 4. agents wired in (code repos) ----------------------------------------------
const pkgPath = join(repoPath, 'package.json')
if (existsSync(pkgPath)) {
  const agentsDir = join(repoPath, '.claude', 'agents')
  if (!existsSync(agentsDir)) {
    problems.push(
      '.claude/agents/ is missing — copy the relevant agents from Revv/agents/ (subtask 17)',
    )
  } else {
    const md = (await readdir(agentsDir)).filter((f) => f.endsWith('.md'))
    if (md.length === 0) problems.push('.claude/agents/ exists but has no agent files')
    else notes.push(`.claude/agents/: ${md.join(', ')}`)
  }
} else {
  notes.push('no package.json — treating as a non-code folder, skipping the agents-dir check')
}

// --- report ----------------------------------------------------------------------
for (const n of notes) console.log(`note: ${n}`)
if (problems.length === 0) {
  console.log('\nverify-foundation: OK')
  process.exit(0)
}
console.error(`\nverify-foundation: ${problems.length} problem(s):`)
for (const p of problems) console.error(`  - ${p}`)
process.exit(1)

/**
 * Strip `//` and block comments and trailing commas from JSONC, without touching the
 * contents of strings (tsconfig `paths` are full of `/` and `*`).
 */
function stripJsonComments(input) {
  let out = ''
  let inString = false
  let inLine = false
  let inBlock = false
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    const next = input[i + 1]
    if (inLine) {
      if (ch === '\n') {
        inLine = false
        out += ch
      }
      continue
    }
    if (inBlock) {
      if (ch === '*' && next === '/') {
        inBlock = false
        i++
      }
      continue
    }
    if (inString) {
      out += ch
      if (ch === '\\') {
        out += next ?? ''
        i++
      } else if (ch === '"') {
        inString = false
      }
      continue
    }
    if (ch === '"') {
      inString = true
      out += ch
      continue
    }
    if (ch === '/' && next === '/') {
      inLine = true
      i++
      continue
    }
    if (ch === '/' && next === '*') {
      inBlock = true
      i++
      continue
    }
    out += ch
  }
  // trailing commas before } or ]
  return out.replace(/,(\s*[}\]])/g, '$1')
}
