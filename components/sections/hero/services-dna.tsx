/**
 * The services-page double helix.
 *
 * Ported from services.html's `buildHelix`, with one improvement over the design: it renders on
 * the SERVER as static SVG. The generator is fully deterministic — fixed geometry, a fixed
 * callout list, and a seeded LCG (`seed = 7`) for the dust — so nothing about it needs a browser.
 * The design builds it with `document.createElementNS` purely because a static HTML file had no
 * other option.
 *
 * That removes a client island: the only motion is the CSS `svcDnaNode` keyframe on the node
 * rings, which needs no JavaScript.
 *
 * Every constant below is the design's.
 */

const CX = 315
const CY = 250
const LEN = 680
const AMP = 74
const TURNS = 3
const RAD = (32 * Math.PI) / 180
const COS = Math.cos(RAD)
const SIN = Math.sin(RAD)

type HelixPoint = { x: number; y: number; depth: number }

/** A point on one strand, already rotated onto the page's diagonal. */
function pointAt(t: number, phase: number): HelixPoint {
  const a = 2 * Math.PI * TURNS * t + phase
  const xl = AMP * Math.sin(a)
  const yl = -LEN / 2 + t * LEN
  return {
    x: CX + xl * COS - yl * SIN,
    y: CY + xl * SIN + yl * COS,
    depth: Math.cos(a),
  }
}

function mix(from: string, to: string, k: number): string {
  const parse = (c: string) => [
    parseInt(c.substr(1, 2), 16),
    parseInt(c.substr(3, 2), 16),
    parseInt(c.substr(5, 2), 16),
  ]
  const a = parse(from)
  const b = parse(to)
  return `rgb(${Math.round(a[0]! + (b[0]! - a[0]!) * k)},${Math.round(a[1]! + (b[1]! - a[1]!) * k)},${Math.round(a[2]! + (b[2]! - a[2]!) * k)})`
}

/** Splits a strand into the stretches passing in front of and behind the other. */
function strandRuns(phase: number): { front: string[]; back: string[] } {
  const runs: { front: string[]; back: string[] } = { front: [], back: [] }
  const steps = 260
  let d: string | null = null
  let isFront: boolean | null = null

  for (let i = 0; i <= steps; i++) {
    const p = pointAt(i / steps, phase)
    const here = p.depth > 0
    const xy = `${p.x.toFixed(1)} ${p.y.toFixed(1)}`
    if (d === null) {
      d = `M${xy}`
      isFront = here
    } else if (here !== isFront) {
      d += `L${xy}` // carry the join across the swap
      runs[isFront ? 'front' : 'back'].push(d)
      d = `M${xy}`
      isFront = here
    } else {
      d += `L${xy}`
    }
  }
  if (d !== null) runs[isFront ? 'front' : 'back'].push(d)
  return runs
}

const strandA = strandRuns(0)
const strandB = strandRuns(Math.PI)

/** Base pairs, inset so they meet the inner edge of each tube rather than crossing it. */
const RUNGS = 34
const INSET = 0.09
const rungs = Array.from({ length: RUNGS - 1 }, (_, index) => {
  const i = index + 1
  const t = i / RUNGS
  const a = pointAt(t, 0)
  const b = pointAt(t, Math.PI)
  const toward = (a.depth + 1) / 2 // 1 = nearest the viewer
  const spread = Math.abs(Math.sin(2 * Math.PI * TURNS * t)) // 0 where the strands cross
  return {
    key: i,
    x1: (a.x + (b.x - a.x) * INSET).toFixed(1),
    y1: (a.y + (b.y - a.y) * INSET).toFixed(1),
    x2: (b.x + (a.x - b.x) * INSET).toFixed(1),
    y2: (b.y + (a.y - b.y) * INSET).toFixed(1),
    stroke: mix('#6C8CF5', '#A78BFA', Math.sin(t * Math.PI)),
    strokeWidth: (3.4 + 4 * toward).toFixed(1),
    opacity: (0.18 + 0.55 * toward * (0.35 + 0.65 * spread)).toFixed(2),
  }
})

/** Fine dust drifting off the helix. The design's LCG, seeded 7 — identical every render. */
const dust = (() => {
  let seed = 7
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }
  return Array.from({ length: 26 }, (_, j) => {
    const pt = pointAt(rnd(), rnd() < 0.5 ? 0 : Math.PI)
    return {
      key: j,
      cx: (pt.x + (rnd() - 0.5) * 130).toFixed(1),
      cy: (pt.y + (rnd() - 0.5) * 90).toFixed(1),
      r: (0.9 + rnd() * 1.7).toFixed(1),
      opacity: (0.15 + rnd() * 0.4).toFixed(2),
    }
  })
})()

/** The shifts the work delivers, labelled off the helix. */
const CALLOUTS = [
  { lines: ['IDEAS', 'INTO SOLUTIONS'], align: 'start', textX: 18, y1: 64, y2: 82, ruleY: 92, ruleX1: 18, ruleX2: 152, elbow: 255, t: 0.25, phase: 0 },
  { lines: ['PEOPLE', 'INTO EXPERIENCES'], align: 'start', textX: 18, y1: 230, y2: 248, ruleY: 258, ruleX1: 18, ruleX2: 170, elbow: 200, t: 0.5833, phase: 0 },
  { lines: ['POTENTIAL', 'INTO PROGRESS'], align: 'end', textX: 542, y1: 300, y2: 318, ruleY: 328, ruleX1: 400, ruleX2: 542, elbow: 385, t: 0.5833, phase: Math.PI },
  { lines: ['COMPLEXITY', 'INTO CLARITY'], align: 'end', textX: 542, y1: 418, y2: 436, ruleY: 446, ruleX1: 395, ruleX2: 542, elbow: 350, t: 0.75, phase: 0 },
] as const

function Strand({ paths, rim, core }: { paths: string[]; rim: string; core: string }) {
  return (
    <>
      {paths.map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke={rim} strokeWidth="24" strokeLinecap="round" />
          <path d={d} fill="none" stroke={core} strokeWidth="17" strokeLinecap="round" />
        </g>
      ))}
    </>
  )
}

export function ServicesDna() {
  return (
    <svg
      viewBox="0 0 560 520"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="A double helix — the Social DNA Labs signature — annotated with the shifts the work delivers: ideas into solutions, people into experiences, potential into progress, and complexity into clarity"
    >
      <defs>
        <radialGradient id="svcDnaGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C7D6FF" stopOpacity="0.5" />
          <stop offset="58%" stopColor="#DCE6FF" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="330" cy="250" rx="200" ry="320" fill="url(#svcDnaGlow)" transform="rotate(32 330 250)" />

      {/* Back segments, then rungs, then front segments — so the strands genuinely weave. */}
      <g id="svcDnaBack">
        <Strand paths={strandA.back} rim="#D2DDF3" core="#EDF2FC" />
        <Strand paths={strandB.back} rim="#D2DDF3" core="#EDF2FC" />
      </g>

      <g id="svcDnaRungs">
        {rungs.map((r) => (
          <line
            key={r.key}
            x1={r.x1}
            y1={r.y1}
            x2={r.x2}
            y2={r.y2}
            stroke={r.stroke}
            strokeWidth={r.strokeWidth}
            strokeLinecap="round"
            opacity={r.opacity}
          />
        ))}
      </g>

      <g id="svcDnaFront">
        <Strand paths={strandA.front} rim="#C2D0EC" core="#FFFFFF" />
        <Strand paths={strandB.front} rim="#C2D0EC" core="#FFFFFF" />
      </g>

      <g id="svcDnaDust">
        {dust.map((d) => (
          <circle key={d.key} cx={d.cx} cy={d.cy} r={d.r} fill="#7C97FF" opacity={d.opacity} />
        ))}
      </g>

      <g id="svcDnaCallouts" className="svc-dna-callouts">
        {CALLOUTS.map((c, idx) => {
          const node = pointAt(c.t, c.phase)
          const anchorX = c.align === 'start' ? c.ruleX2 : c.ruleX1
          return (
            <g key={c.lines[0]}>
              {c.lines.map((line, n) => (
                <text
                  key={line}
                  className="svc-dna-label"
                  x={c.textX}
                  y={n === 0 ? c.y1 : c.y2}
                  {...(c.align === 'end' ? { textAnchor: 'end' as const } : {})}
                >
                  {line}
                </text>
              ))}
              <line className="svc-dna-rule" x1={c.ruleX1} y1={c.ruleY} x2={c.ruleX2} y2={c.ruleY} />
              <path
                className="svc-dna-connector"
                d={`M${anchorX} ${c.ruleY}L${c.elbow} ${c.ruleY}L${node.x.toFixed(1)} ${node.y.toFixed(1)}`}
              />
              <circle
                className="svc-dna-node-ring"
                cx={node.x.toFixed(1)}
                cy={node.y.toFixed(1)}
                r={5}
                fill="#FFFFFF"
                stroke="#2B49DB"
                strokeWidth="1.2"
                style={{ '--node-delay': `${idx * 0.55}s` } as React.CSSProperties}
              />
              <circle cx={node.x.toFixed(1)} cy={node.y.toFixed(1)} r={2} fill="#2B49DB" />
            </g>
          )
        })}
      </g>

      <g className="svc-dna-footnote">
        <text className="svc-dna-caption" x="542" y="492" textAnchor="end">
          BUILT ON
        </text>
        <text className="svc-dna-caption" x="542" y="506" textAnchor="end">
          A BRIGHTER TOMORROW
        </text>
        <line className="svc-dna-rule" x1="430" y1="514" x2="542" y2="514" />
      </g>
    </svg>
  )
}
