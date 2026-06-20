// Visual capture harness — boots a headless Chromium against the running dev
// server and shoots the DATUM screens × themes into .shots/.
//
//   node scripts/shoot.mjs              # default set (upload + viewer × 3 themes)
//   node scripts/shoot.mjs --url http://localhost:5173
//
// Used as the visual-verification level of the agent harness: a reviewer
// compares these against reference/design-handoff/screenshots/.
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const URL = process.argv.includes('--url')
  ? process.argv[process.argv.indexOf('--url') + 1]
  : 'http://localhost:5173'
const OUT = '.shots'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function setTheme(page, label) {
  await page.getByRole('button', { name: label, exact: false }).first().click()
  await sleep(250)
}

async function gotoViewer(page) {
  await page.getByText('Use sample set').click()
  await page.getByText('Reconstruct 3D model').click()
  // Processing auto-advances (~5.4s); wait for the viewer canvas, then for WebGL.
  await page.waitForSelector('canvas', { timeout: 15000 })
  await sleep(2000)
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch({
    args: ['--enable-unsafe-swiftshader', '--use-gl=angle'],
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  await page.goto(URL, { waitUntil: 'networkidle' })
  await sleep(600)

  // Upload screen (Precision default)
  await page.screenshot({ path: `${OUT}/upload-precision.png` })
  console.log(`✓ ${OUT}/upload-precision.png`)

  // Viewer × 3 themes
  await gotoViewer(page)
  for (const [theme, label] of [
    ['precision', 'Precision'],
    ['dark', 'Topo'],
    ['light', 'Studio'],
  ]) {
    await setTheme(page, label)
    await sleep(400)
    await page.screenshot({ path: `${OUT}/viewer-${theme}.png` })
    console.log(`✓ ${OUT}/viewer-${theme}.png`)
  }

  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
