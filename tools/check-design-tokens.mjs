#!/usr/bin/env node
/**
 * check-design-tokens.mjs — fail if a raw color literal appears in app code.
 *
 * Every color in Revv comes from @revv/tokens (docs/design-system.md, ADR 0005).
 * This guards that rule across revv-mobile, revv-web, and the report template.
 *
 * Usage:  node check-design-tokens.mjs <repo-path>
 * Exit:   0 = clean, 1 = violations found, 2 = bad invocation
 *
 * Zero dependencies. Node 22+.
 */

import { readdir, readFile } from 'node:fs/promises'
import { join, extname, relative, basename } from 'node:path'
import { existsSync } from 'node:fs'

const repoPath = process.argv[2]
if (!repoPath) {
  console.error('usage: node check-design-tokens.mjs <repo-path>')
  process.exit(2)
}

// The tokens package is the one repo that DEFINES the raw values — its src/ is exempt
// whether the scanner is pointed at `.` from inside it or at `revv-tokens/` from outside.
let isTokensPackage = false
try {
  const pkgPath = join(repoPath, 'package.json')
  if (existsSync(pkgPath)) {
    isTokensPackage = JSON.parse(await readFile(pkgPath, 'utf8')).name === '@revv/tokens'
  }
} catch {
  /* not fatal */
}

// Directories and files that are ALLOWED to contain raw color values.
const ALLOW_DIR = ['node_modules', '.git', 'dist', 'build', '.next', '.expo', 'coverage']
const ALLOW_PATH_SUBSTRING = [
  // the tokens package itself defines the raw values
  'revv-tokens/src',
  '@revv/tokens',
  // generated / vendored
  '.generated.',
  'ios/', 'android/', // native project files
]
const ALLOW_FILE = ['app.json', 'app.config.js', 'app.config.ts'] // expo splash/icon colors

const SCAN_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.html'])

// hex (#abc / #aabbcc / #aabbccdd), rgb()/rgba(), hsl()/hsla()
const COLOR_RE =
  /#[0-9a-fA-F]{3,8}\b|(?:rgb|rgba|hsl|hsla)\s*\([^)]*\)/g

// allow a few well-known non-color tokens that look like hex
const FALSE_POSITIVE = /#[0-9a-fA-F]{3,8};?\s*(?:\*\/|-->)?\s*$/ // trailing anchors only, keep simple

const violations = []

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) {
      if (ALLOW_DIR.includes(e.name)) continue
      await walk(full)
      continue
    }
    if (!SCAN_EXT.has(extname(e.name))) continue
    if (ALLOW_FILE.includes(basename(e.name))) continue
    const rel = relative(repoPath, full).replaceAll('\\', '/')
    if (ALLOW_PATH_SUBSTRING.some((s) => rel.includes(s))) continue
    if (isTokensPackage && (rel === 'src' || rel.startsWith('src/'))) continue
    await scan(full, rel)
  }
}

async function scan(full, rel) {
  const text = await readFile(full, 'utf8')
  const lines = text.split(/\r?\n/)
  lines.forEach((line, i) => {
    // skip obvious comment-only doc references to this rule
    if (/eslint-disable.*revv-tokens/.test(line)) return
    const matches = line.match(COLOR_RE)
    if (!matches) return
    for (const m of matches) {
      // ignore url fragments / ids like href="#top"
      if (/["'(]#[a-zA-Z][\w-]*["')]/.test(line) && !/#[0-9a-fA-F]{3,8}\b/.test(m)) continue
      violations.push({ rel, line: i + 1, text: line.trim(), match: m })
    }
  })
}

await walk(repoPath)

if (violations.length === 0) {
  console.log('check-design-tokens: clean — no raw color literals outside @revv/tokens')
  process.exit(0)
}

console.error(`check-design-tokens: ${violations.length} raw color literal(s) found:\n`)
for (const v of violations) {
  console.error(`  ${v.rel}:${v.line}  ${v.match}`)
  console.error(`      ${v.text}`)
}
console.error('\nUse a token from @revv/tokens instead. See docs/design-system.md.')
process.exit(1)
