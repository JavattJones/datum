// verify.mjs — executable verification for the DATUM harness (cross-platform).
//
// The agent does not say "it works", it proves it. This is the judge.
//
//   node scripts/verify.mjs           full: structural + typecheck + build + visual (if dev server up)
//   node scripts/verify.mjs --quick   structural + typecheck (skip build & shots)
//   node scripts/verify.mjs --state   structural only, silent on success (used by the Stop hook)
//
// Levels mirror docs/verification.md. The visual level (shoot) is what makes a
// hi-fi UI verifiable: it captures .shots/ for the reviewer to compare against
// reference/design-handoff/screenshots/.
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const MODE = process.argv.includes('--state')
  ? 'state'
  : process.argv.includes('--quick')
    ? 'quick'
    : 'full'

const c = (n, s) => `\x1b[${n}m${s}\x1b[0m`
const silent = MODE === 'state'
let failed = false

const ok = (m) => !silent && console.log(`${c(32, '[OK]')}    ${m}`)
const bad = (m) => {
  failed = true
  console.error(`${c(31, '[FAIL]')}  ${m}`)
}
const warn = (m) => !silent && console.log(`${c(33, '[WARN]')}  ${m}`)
const head = (m) => !silent && console.log(`\n── ${m} ──`)

function run(cmd) {
  // Single string + shell:true avoids the DEP0190 arg-escaping warning.
  return spawnSync(cmd, { stdio: 'inherit', shell: true }).status === 0
}

// 1 — Harness base files
head('1. Harness base files')
const base = [
  'AGENTS.md',
  'feature_list.json',
  'CHECKPOINTS.md',
  'progress/current.md',
  'docs/architecture.md',
  'docs/conventions.md',
  'docs/verification.md',
]
for (const f of base) (existsSync(f) ? ok(`exists ${f}`) : bad(`missing base file: ${f}`))

// 2 — feature_list integrity (the "one feature at a time" invariant)
head('2. feature_list.json')
try {
  const data = JSON.parse(readFileSync('feature_list.json', 'utf8'))
  const valid = new Set(['pending', 'in_progress', 'done', 'blocked'])
  const inProgress = data.features.filter((f) => f.status === 'in_progress')
  const badStatus = data.features.filter((f) => !valid.has(f.status))
  if (inProgress.length > 1)
    bad(`${inProgress.length} features in_progress (max 1): ${inProgress.map((f) => f.id).join(', ')}`)
  if (badStatus.length) bad(`invalid status on features: ${badStatus.map((f) => f.id).join(', ')}`)
  if (inProgress.length <= 1 && !badStatus.length)
    ok(`valid (${data.features.length} features, ${inProgress.length} in progress)`)
} catch (e) {
  bad(`feature_list.json invalid: ${e.message}`)
}

// --state stops here: structural integrity only, near-zero cost.
if (MODE === 'state') process.exit(failed ? 2 : 0)

// 3 — Typecheck
head('3. Typecheck')
run('npm run typecheck') ? ok('tsc --noEmit clean') : bad('type errors')

if (MODE === 'full') {
  // 4 — Build
  head('4. Build')
  run('npx vite build') ? ok('vite build') : bad('build failed')

  // 5 — Visual capture (only if the dev server is reachable)
  head('5. Visual capture')
  let up = false
  try {
    up = (await fetch('http://localhost:5173/')).ok
  } catch {
    up = false
  }
  if (up) {
    run('node scripts/shoot.mjs')
      ? ok('screenshots written to .shots/ — compare against reference/design-handoff/screenshots/')
      : bad('shoot failed')
  } else {
    warn('dev server not on :5173 — skipping visual capture. Run `npm run dev` then `npm run shoot`.')
  }
}

console.log('')
if (failed) {
  console.error(c(31, '[FAIL]  Verification failed — do not mark anything done.'))
  process.exit(1)
}
console.log(c(32, '[OK]    Verification passed.'))
