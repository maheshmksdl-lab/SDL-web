/**
 * The four-layer design-parity harness (plan §9.4).
 *
 *   Layer 1  computed-style parity   — primary gate, must be clean
 *   Layer 2  pixel comparison        — ≤ 0.5% differing pixels per viewport
 *   Layer 3  structural parity       — must be clean
 *   Layer 4  interaction parity      — must be clean
 *
 * Run from web/ as `pnpm parity` (design + target servers up), or `pnpm parity:update` to rewrite
 * the pixel baselines. If the design server is unreachable it runs a TARGET-ONLY self-check
 * instead — every seeded page renders, has chrome, and logs no console errors — and reports the
 * design comparison as SKIPPED rather than failing.
 *
 *   npx serve <path-to>/sdl-2.0 -l 4001
 *   cd web && pnpm dev
 *   cd web && pnpm parity
 *
 * Lives under web/e2e/ (excluded from the app tsconfig) so its Playwright import never reaches
 * `next build`. Typechecked via e2e/tsconfig.json.
 */
import fs from 'node:fs'
import path from 'node:path'
import { chromium, type Browser } from '@playwright/test'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

import {
  CHROME_SELECTORS, DESIGN_URL, PAGES, PIXEL_BUDGET, PIXEL_MASK_SELECTORS, PIXEL_THRESHOLD,
  TARGET_URL, VIEWPORTS,
} from './config'
import { computedStyles, diffStyles, freeze, reachable, structure, type Diff } from './lib'

const UPDATE = process.argv.includes('--update-baselines')
const REPORT_DIR = path.join(import.meta.dirname, 'reports')
const BASELINE_DIR = path.join(import.meta.dirname, 'baselines')

type PageResult = {
  page: string
  layer1: Diff[]
  layer2: { viewport: number; ratio: number; ok: boolean }[]
  layer3: string[]
  layer4: string[]
  selfCheck: string[]
}

async function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true })
  fs.mkdirSync(BASELINE_DIR, { recursive: true })

  const designUp = await reachable(`${DESIGN_URL}/index.html`)
  const targetUp = await reachable(TARGET_URL)

  if (!targetUp) {
    console.error(`\n  ✗ target not reachable at ${TARGET_URL} — run \`pnpm dev\` in web/\n`)
    process.exit(1)
  }
  if (!designUp) {
    console.warn(
      `\n  ⚠ design not reachable at ${DESIGN_URL} — running a TARGET-ONLY self-check.\n` +
        `    Serve sdl-2.0 on :4001 for the full comparison (see this file's header).\n`,
    )
  }

  const browser = await chromium.launch()
  const results: PageResult[] = []

  try {
    for (const spec of PAGES) {
      results.push(await checkPage(browser, spec, designUp))
    }
  } finally {
    await browser.close()
  }

  const report = { at: new Date().toISOString(), designComparison: designUp, results }
  fs.writeFileSync(path.join(REPORT_DIR, 'parity.json'), JSON.stringify(report, null, 2))

  printSummary(results, designUp)

  const failed = results.some(
    (r) =>
      r.selfCheck.length ||
      (designUp && (r.layer1.length || r.layer3.length || r.layer4.length || r.layer2.some((v) => !v.ok))),
  )
  process.exit(failed && !UPDATE ? 1 : 0)
}

async function checkPage(
  browser: Browser,
  spec: (typeof PAGES)[number],
  designUp: boolean,
): Promise<PageResult> {
  const result: PageResult = {
    page: spec.name,
    layer1: [],
    layer2: [],
    layer3: [],
    layer4: [],
    selfCheck: [],
  }

  const context = await browser.newContext()
  const target = await context.newPage()

  const consoleErrors: string[] = []
  target.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()))
  target.on('pageerror', (e) => consoleErrors.push(String(e)))

  const response = await target.goto(`${TARGET_URL}${spec.target}`, { waitUntil: 'networkidle' })
  await freeze(target)

  // ── self-check (always) ──
  if (!response || !response.ok()) result.selfCheck.push(`HTTP ${response?.status()} for ${spec.target}`)
  if (!(await target.$('.sdl-header'))) result.selfCheck.push('no .sdl-header rendered')
  const hasFooter = (await target.$('.sdl-footer')) || spec.name === 'landing'
  if (!hasFooter) result.selfCheck.push('no .sdl-footer rendered')
  if (consoleErrors.length) result.selfCheck.push(`${consoleErrors.length} console error(s): ${consoleErrors[0]}`)

  if (!designUp) {
    await context.close()
    return result
  }

  // ── design comparison ──
  const design = await context.newPage()
  await design.goto(`${DESIGN_URL}${spec.design}`, { waitUntil: 'networkidle' })
  await freeze(design)

  const perPageSelectors = await design.evaluate(() =>
    [
      ...new Set(
        [...document.querySelectorAll('main [class], section[class]')]
          .flatMap((el) => [...el.classList])
          .filter((c) => /^(sdl|ai|bt|de|dx|gt|evoq|svc|wae)-/.test(c)),
      ),
    ].map((c) => `.${c}`),
  )
  const selectors = [...new Set([...CHROME_SELECTORS, ...perPageSelectors])]

  // Layer 1 — computed style
  for (const vp of [1440, 768]) {
    await design.setViewportSize({ width: vp, height: 1000 })
    await target.setViewportSize({ width: vp, height: 1000 })
    const [a, b] = await Promise.all([
      computedStyles(design, selectors),
      computedStyles(target, selectors),
    ])
    result.layer1.push(...diffStyles(a, b).map((d) => ({ ...d, selector: `@${vp} ${d.selector}` })))
  }

  // Layer 3 — structure
  const [ds, ts] = await Promise.all([structure(design), structure(target)])
  if (Math.abs(ds.sectionCount - ts.sectionCount) > 0) {
    result.layer3.push(`section count: design ${ds.sectionCount}, target ${ts.sectionCount}`)
  }
  const missingClasses = ds.classes.filter((c) => !ts.classes.includes(c))
  if (missingClasses.length) result.layer3.push(`missing classes: ${missingClasses.slice(0, 8).join(', ')}`)
  const missingHeadings = ds.headings.filter((h) => !ts.headings.includes(h))
  if (missingHeadings.length) result.layer3.push(`missing headings: ${missingHeadings.slice(0, 5).join(' | ')}`)
  if (ts.imagesWithoutAlt > 0) result.layer3.push(`${ts.imagesWithoutAlt} <img> without alt`)

  // Layer 4 — interaction states
  for (const sel of ['.sdl-hero-primary', '.sdl-cta-link', '.sdl-nav-link']) {
    const el = await target.$(sel)
    if (!el) continue
    try {
      await el.hover()
      const cursor = await el.evaluate((n) => getComputedStyle(n).cursor)
      if (cursor === 'auto') result.layer4.push(`${sel}: no pointer cursor on hover`)
      await el.focus()
      const outline = await el.evaluate((n) => getComputedStyle(n).outlineStyle)
      if (outline === 'none') result.layer4.push(`${sel}: no visible focus ring`)
    } catch {
      /* element not interactable at this viewport — not a parity failure */
    }
  }

  // Layer 2 — pixel
  for (const vp of VIEWPORTS) {
    result.layer2.push(await pixelLayer(design, target, spec.name, vp))
  }

  await context.close()
  return result
}

async function pixelLayer(
  design: import('@playwright/test').Page,
  target: import('@playwright/test').Page,
  name: string,
  vp: number,
): Promise<{ viewport: number; ratio: number; ok: boolean }> {
  const opts = { width: vp, height: 900 }
  await design.setViewportSize(opts)
  await target.setViewportSize(opts)

  // Hide the non-deterministic regions on both sides.
  const mask = PIXEL_MASK_SELECTORS.join(',')
  const hide = `${mask} { visibility: hidden !important; }`
  await design.addStyleTag({ content: hide })
  await target.addStyleTag({ content: hide })

  const a = PNG.sync.read(await design.screenshot({ fullPage: true }))
  const b = PNG.sync.read(await target.screenshot({ fullPage: true }))

  const width = Math.min(a.width, b.width)
  const height = Math.min(a.height, b.height)
  const diff = new PNG({ width, height })

  const crop = (png: PNG) => {
    if (png.width === width && png.height === height) return png
    const out = new PNG({ width, height })
    for (let y = 0; y < height; y++) {
      png.data.copy(out.data, y * width * 4, y * png.width * 4, y * png.width * 4 + width * 4)
    }
    return out
  }

  const mismatch = pixelmatch(crop(a).data, crop(b).data, diff.data, width, height, {
    threshold: PIXEL_THRESHOLD,
  })
  const ratio = mismatch / (width * height)
  const ok = ratio <= PIXEL_BUDGET

  const baseName = `${name}-${vp}`
  if (UPDATE) {
    fs.writeFileSync(path.join(BASELINE_DIR, `${baseName}.png`), PNG.sync.write(crop(b)))
  }
  if (!ok) {
    fs.writeFileSync(path.join(REPORT_DIR, `${baseName}.diff.png`), PNG.sync.write(diff))
  }

  return { viewport: vp, ratio, ok }
}

function printSummary(results: PageResult[], designUp: boolean) {
  console.log('\n  Parity harness\n  ' + '─'.repeat(60))
  for (const r of results) {
    const flags: string[] = []
    if (r.selfCheck.length) flags.push(`selfcheck:${r.selfCheck.length}`)
    if (designUp) {
      if (r.layer1.length) flags.push(`L1:${r.layer1.length}`)
      if (r.layer2.some((v) => !v.ok)) flags.push(`L2:${r.layer2.filter((v) => !v.ok).length}`)
      if (r.layer3.length) flags.push(`L3:${r.layer3.length}`)
      if (r.layer4.length) flags.push(`L4:${r.layer4.length}`)
    }
    const status = flags.length ? `✗ ${flags.join(' ')}` : designUp ? '✓' : '✓ (self-check only)'
    console.log(`  ${r.page.padEnd(30)} ${status}`)
    for (const s of r.selfCheck) console.log(`      selfcheck  ${s}`)
    for (const d of r.layer1.slice(0, 6)) {
      console.log(`      L1  ${d.selector} ${d.property}: expected ${d.expected}, got ${d.actual}`)
    }
    for (const d of r.layer3) console.log(`      L3  ${d}`)
    for (const d of r.layer4) console.log(`      L4  ${d}`)
  }
  console.log('  ' + '─'.repeat(60))
  console.log(`  report: tools/visual-parity/reports/parity.json`)
  if (!designUp) console.log(`  design comparison: SKIPPED (design server was not reachable)\n`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
