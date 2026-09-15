'use client'

import { useEffect, useRef } from 'react'

/**
 * The home-page hero animation.
 *
 * Ported from index.html's `HeroAnimation`, value for value: the same seeded RNG
 * (`mulberry32(11)`, so the formation is identical on every load), the same arrow formation
 * geometry, the same seven-phase cycle and easing curves, and the same colour interpolation.
 *
 * Two deliberate changes from the design, neither visible while the canvas is on screen:
 *
 *   1. requestAnimationFrame instead of `setInterval(…, 1000/30)`. The design's interval keeps
 *      running when the tab is hidden and when the hero has scrolled away; rAF is paused by the
 *      browser in a background tab, and an IntersectionObserver stops it once the hero leaves
 *      the viewport. Frames are still throttled to the design's 30fps so the motion matches.
 *   2. `prefers-reduced-motion` renders one static frame of the formed state rather than
 *      animating. The design's CSS disables the reveal animation but leaves this canvas running.
 */

const W = 1040
const H = 960

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function lerpColor(c1: string, c2: string, t: number) {
  const p1 = c1.match(/\w\w/g)!.map((h) => parseInt(h, 16))
  const p2 = c2.match(/\w\w/g)!.map((h) => parseInt(h, 16))
  const r = p1.map((v, i) => Math.round(lerp(v, p2[i]!, t)))
  return '#' + r.map((v) => v.toString(16).padStart(2, '0')).join('')
}

/** The design's seeded PRNG — keeps the formation identical between loads and machines. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5)
const easeInOutQuart = (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2)
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

function rgba(hex: string, a: number) {
  const p = hex.match(/\w\w/g)!.map((h) => parseInt(h, 16))
  return `rgba(${p[0]},${p[1]},${p[2]},${a})`
}

type Point = { x: number; y: number }

type Particle = {
  target: Point
  t: number
  formationColor: string
  formationAlpha: number
  formationSize: number
  scatter: Point
  converged: Point
  ctrl: Point
  scatterColor: string
  scatterSize: number
  stagger: number
  driftAmp: number
  driftSpeed: number
  driftPhase: number
  pulsePhase: number
}

type State = {
  x: number
  y: number
  alpha: number
  size: number
  color: string
  rayAlpha: number
  moving: boolean
}

const PHASES = {
  scatter: 1400,
  movement: 2600,
  convergeHold: 1000,
  resolve: 1700,
  formedHold: 3000,
  reset: 1900,
  pause: 500,
} as const

const PHASE_ORDER = Object.keys(PHASES) as (keyof typeof PHASES)[]
const CYCLE = PHASE_ORDER.reduce((sum, name) => sum + PHASES[name], 0)

const FOCUS = { x: 898, y: 480 }

/** The arrow: a rectangular shaft plus a triangular head, sampled on a 23px lattice. */
function buildFormation() {
  const tip = { x: 936, y: 480 }
  const headBaseX = 712
  const headHalfH = 162
  const shaftLeftX = 494
  const shaftHalfH = 74
  const spacing = 23

  const A = { x: headBaseX, y: 480 - headHalfH }
  const B = { x: headBaseX, y: 480 + headHalfH }

  const sign = (p1: Point, p2: Point, p3: Point) =>
    (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y)

  const inTriangle = (pt: Point) => {
    const d1 = sign(pt, A, B)
    const d2 = sign(pt, B, tip)
    const d3 = sign(pt, tip, A)
    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0
    return !(hasNeg && hasPos)
  }

  const pts: Point[] = []
  for (let x = shaftLeftX; x <= tip.x; x += spacing) {
    for (let y = 480 - headHalfH; y <= 480 + headHalfH; y += spacing) {
      const inShaft = x <= headBaseX && Math.abs(y - 480) <= shaftHalfH
      const inHead = x >= headBaseX && inTriangle({ x, y })
      if (inShaft || inHead) pts.push({ x, y })
    }
  }

  const span = tip.x - shaftLeftX
  return pts.map((p) => ({ pos: p, t: clamp01((p.x - shaftLeftX) / span) }))
}

function buildParticles(): Particle[] {
  const rng = mulberry32(11)
  const scatterPalette = ['#22D3EE', '#38BDF8', '#60A5FA', '#4F76F6', '#7C6BF0', '#8B5CF6']
  const centre = { x: 262, y: 480 }

  return buildFormation().map((f) => {
    const a = rng() * Math.PI * 2
    const r = Math.pow(rng(), 0.62) * 178
    const scatter = { x: centre.x + Math.cos(a) * r * 1.02, y: centre.y + Math.sin(a) * r * 0.94 }
    const approach = 0.82 + rng() * 0.14
    const converged = {
      x: lerp(scatter.x, FOCUS.x, approach),
      y: lerp(scatter.y, FOCUS.y, approach),
    }
    const mx = (scatter.x + converged.x) / 2
    const my = (scatter.y + converged.y) / 2
    const dx = converged.x - scatter.x
    const dy = converged.y - scatter.y
    const len = Math.hypot(dx, dy) || 1
    const bow = (24 + rng() * 62) * (rng() > 0.5 ? 1 : -1)

    return {
      target: f.pos,
      t: f.t,
      formationColor: lerpColor('#7DD8F0', '#2C2C9E', Math.pow(f.t, 0.85)),
      formationAlpha: lerp(0.5, 1, Math.pow(f.t, 0.7)),
      formationSize: lerp(2.6, 5.4, Math.pow(f.t, 0.75)),
      scatter,
      converged,
      ctrl: { x: mx + (-dy / len) * bow, y: my + (dx / len) * bow },
      scatterColor: scatterPalette[Math.floor(rng() * scatterPalette.length)]!,
      scatterSize: 2.4 + Math.pow(rng(), 1.6) * 4.4,
      stagger: Math.pow(rng(), 1.3) * 0.42,
      driftAmp: 3 + rng() * 5,
      driftSpeed: 0.32 + rng() * 0.4,
      driftPhase: rng() * Math.PI * 2,
      pulsePhase: rng() * Math.PI * 2,
    }
  })
}

function phaseAt(cyclePos: number) {
  let start = 0
  for (const name of PHASE_ORDER) {
    if (cyclePos < start + PHASES[name]) {
      return { phase: name, phaseT: (cyclePos - start) / PHASES[name] }
    }
    start += PHASES[name]
  }
  return { phase: 'pause' as const, phaseT: 1 }
}

function stateAt(p: Particle, elapsed: number): State {
  const { phase, phaseT } = phaseAt(((elapsed % CYCLE) + CYCLE) % CYCLE)
  const time = elapsed / 1000

  if (phase === 'scatter' || phase === 'pause') {
    return {
      x: p.scatter.x + Math.sin(time * p.driftSpeed + p.driftPhase) * p.driftAmp,
      y: p.scatter.y + Math.cos(time * p.driftSpeed * 0.86 + p.driftPhase) * p.driftAmp,
      alpha: phase === 'scatter' ? lerp(0.3, 0.8, clamp01(phaseT * 2.4)) : 0.8,
      size: p.scatterSize,
      color: p.scatterColor,
      rayAlpha: 0,
      moving: false,
    }
  }

  if (phase === 'movement') {
    const local = clamp01((phaseT - p.stagger) / (1 - p.stagger))
    const e = easeInOutQuart(local)
    const u = 1 - e
    const idle = (1 - e) * p.driftAmp
    return {
      x: u * u * p.scatter.x + 2 * u * e * p.ctrl.x + e * e * p.converged.x + Math.sin(time * p.driftSpeed + p.driftPhase) * idle,
      y: u * u * p.scatter.y + 2 * u * e * p.ctrl.y + e * e * p.converged.y + Math.cos(time * p.driftSpeed * 0.86 + p.driftPhase) * idle,
      alpha: lerp(0.8, 1, e),
      size: lerp(p.scatterSize, 4.2, e * 0.8),
      color: lerpColor(p.scatterColor, '#3E7BF2', e),
      rayAlpha: Math.sin(clamp01(e) * Math.PI) * 0.22,
      moving: true,
    }
  }

  if (phase === 'convergeHold') {
    const breathe = Math.sin(time * 1.9 + p.pulsePhase)
    return {
      x: p.converged.x + breathe * 1.4,
      y: p.converged.y + Math.cos(time * 1.6 + p.pulsePhase) * 1.4,
      alpha: 1,
      size: 4.2 + breathe * 0.2,
      color: '#3E7BF2',
      rayAlpha: 0.2 * (1 - phaseT * 0.35),
      moving: false,
    }
  }

  if (phase === 'resolve') {
    const local = clamp01((phaseT - p.stagger * 0.5) / (1 - p.stagger * 0.5))
    const e = easeOutQuint(local)
    return {
      x: lerp(p.converged.x, p.target.x, e),
      y: lerp(p.converged.y, p.target.y, e),
      alpha: lerp(1, p.formationAlpha, e),
      size: lerp(4.2, p.formationSize, e),
      color: lerpColor('#3E7BF2', p.formationColor, e),
      rayAlpha: Math.max(0, 0.16 * (1 - e * 2.6)),
      moving: e < 0.98,
    }
  }

  if (phase === 'formedHold') {
    const wavePos = ((time * 0.42) % 2.2) - 0.35
    const wave = Math.exp(-Math.pow(p.t - wavePos, 2) / 0.014)
    return {
      x: p.target.x,
      y: p.target.y,
      alpha: clamp01(p.formationAlpha * (1 + wave * 0.35)),
      size: p.formationSize * (1 + wave * 0.14),
      color: lerpColor(p.formationColor, '#5EEAF6', wave * 0.35),
      rayAlpha: 0,
      moving: false,
    }
  }

  // reset
  const local = clamp01((phaseT - p.stagger * 0.6) / (1 - p.stagger * 0.6))
  const e = easeInOutCubic(local)
  return {
    x: lerp(p.target.x, p.scatter.x, e),
    y: lerp(p.target.y, p.scatter.y, e),
    alpha: lerp(p.formationAlpha, 0.45, e),
    size: lerp(p.formationSize, p.scatterSize, e),
    color: lerpColor(p.formationColor, p.scatterColor, e),
    rayAlpha: 0,
    moving: true,
  }
}

function draw(ctx: CanvasRenderingContext2D, particles: Particle[], elapsed: number) {
  const { phase, phaseT } = phaseAt(elapsed % CYCLE)
  const time = elapsed / 1000
  ctx.clearRect(0, 0, W, H)

  const formStrength = phase === 'formedHold' ? 1 : phase === 'resolve' ? easeOutQuint(phaseT) : 0
  if (formStrength > 0.01) {
    const g = ctx.createRadialGradient(760, 480, 30, 760, 480, 400)
    g.addColorStop(0, rgba('#3B82F6', 0.07 * formStrength))
    g.addColorStop(1, rgba('#3B82F6', 0))
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
  }

  ctx.lineCap = 'round'

  for (const p of particles) {
    const s = stateAt(p, elapsed)

    if (s.rayAlpha > 0.008) {
      ctx.strokeStyle = rgba(s.color, s.rayAlpha * 0.8)
      ctx.lineWidth = 0.7
      ctx.beginPath()
      ctx.moveTo(p.scatter.x, p.scatter.y)
      ctx.quadraticCurveTo(p.ctrl.x, p.ctrl.y, s.x, s.y)
      ctx.stroke()
    }

    // The trail is sampled from two earlier moments of the same function, exactly as the
    // design does — cheaper and more stable than storing per-particle history.
    if (s.moving) {
      const a = stateAt(p, elapsed - 38)
      const b = stateAt(p, elapsed - 78)
      if (Math.hypot(s.x - b.x, s.y - b.y) > 2) {
        ctx.strokeStyle = rgba(s.color, Math.min(0.3, s.alpha * 0.26))
        ctx.lineWidth = s.size * 0.9
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(s.x, s.y)
        ctx.stroke()
        ctx.strokeStyle = rgba(s.color, Math.min(0.11, s.alpha * 0.09))
        ctx.lineWidth = s.size * 0.5
        ctx.beginPath()
        ctx.moveTo(b.x, b.y)
        ctx.lineTo(a.x, a.y)
        ctx.stroke()
      }
    }

    ctx.fillStyle = rgba(s.color, s.alpha * 0.13)
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.size * 2.6, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = rgba(s.color, s.alpha)
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
    ctx.fill()
  }

  const coreStrength =
    phase === 'movement'
      ? clamp01((phaseT - 0.5) / 0.5)
      : phase === 'convergeHold'
        ? 1
        : phase === 'resolve'
          ? Math.max(0, 1 - phaseT * 3)
          : 0

  if (coreStrength > 0.01) {
    const r = 46 * (1 + Math.sin(time * 2.6) * 0.06)
    const g = ctx.createRadialGradient(FOCUS.x, FOCUS.y, 0, FOCUS.x, FOCUS.y, r)
    g.addColorStop(0, rgba('#FFFFFF', 0.9 * coreStrength))
    g.addColorStop(0.3, rgba('#38BDF8', 0.5 * coreStrength))
    g.addColorStop(1, rgba('#38BDF8', 0))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(FOCUS.x, FOCUS.y, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const particles = buildParticles()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const cw = canvas.clientWidth || 520
      canvas.width = Math.round(cw * dpr)
      canvas.height = Math.round(cw * dpr * (H / W))
      const scale = canvas.width / W
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
      ctx.clearRect(0, 0, W, H)
    }
    resize()

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    if (reduceMotion.matches) {
      // One frame from the middle of formedHold: the arrow, fully formed and still.
      const formed = PHASES.scatter + PHASES.movement + PHASES.convergeHold + PHASES.resolve + PHASES.formedHold / 2
      draw(ctx, particles, formed)
      return
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    let frame = 0
    let running = true
    const start = performance.now()
    let lastFrame = 0
    const FRAME_MS = 1000 / 30 // the design's rate

    const loop = (now: number) => {
      if (!running) return
      frame = requestAnimationFrame(loop)
      if (now - lastFrame < FRAME_MS) return
      lastFrame = now
      draw(ctx, particles, now - start)
    }
    frame = requestAnimationFrame(loop)

    // Stop once the hero scrolls away — the design's setInterval runs forever, burning CPU
    // and battery on every page the visitor scrolls past.
    const visibility = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.isIntersecting && !running) {
          running = true
          lastFrame = 0
          frame = requestAnimationFrame(loop)
        } else if (!entry.isIntersecting && running) {
          running = false
          cancelAnimationFrame(frame)
        }
      },
      { threshold: 0 },
    )
    visibility.observe(canvas)

    return () => {
      running = false
      cancelAnimationFrame(frame)
      observer.disconnect()
      visibility.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} id="heroCanvas" width={W} height={H} aria-hidden="true" />
}
