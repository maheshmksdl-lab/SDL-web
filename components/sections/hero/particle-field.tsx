/**
 * The drifting particle field behind five of the hero visuals.
 *
 * Verified identical across ai-transformation, business-transformation, digital-engineering,
 * digital-experience and growth-transformation: same 16 positions, same radii, same per-particle
 * `--dx/--dy/--dur/--delay`, and the same fill pattern `0102100120100100` over a three-colour
 * palette. Only the palette differs.
 *
 * Extracting it is the same de-duplication sanctioned for the CSS (plan §6.3 deviation #2):
 * the rendered output is byte-identical to the design, five copies become one.
 *
 * Animation lives in CSS (`@keyframes aiParticleDrift` and friends, in styles/sections/hero.css),
 * driven by the custom properties below — so this is a server component with no JavaScript.
 */

/** cx, cy, r, --dx, --dy, --dur, --delay, palette index */
const PARTICLES: [number, number, number, string, string, string, string, 0 | 1 | 2][] = [
  [140, 310, 3, '12px', '-7px', '8.2s', '0s', 0],
  [110, 260, 2.5, '14px', '-2px', '9.1s', '0.6s', 1],
  [95, 330, 3.5, '12px', '-7px', '7.6s', '1.2s', 0],
  [160, 370, 2, '9px', '-11px', '8.7s', '1.8s', 2],
  [70, 290, 2.8, '14px', '-4px', '9.4s', '2.4s', 1],
  [190, 400, 3, '6px', '-13px', '8.1s', '3s', 0],
  [50, 230, 2, '14px', '1px', '7.3s', '3.6s', 0],
  [120, 190, 2.5, '13px', '5px', '8.9s', '4.2s', 1],
  [220, 420, 2.2, '3px', '-14px', '9.2s', '4.8s', 2],
  [80, 160, 3, '13px', '6px', '7.8s', '5.4s', 0],
  [150, 140, 2, '10px', '9px', '9.7s', '0.3s', 1],
  [250, 430, 2.6, '1px', '-14px', '8.4s', '1.5s', 0],
  [40, 340, 2, '13px', '-6px', '9s', '2.1s', 0],
  [180, 115, 2.4, '8px', '12px', '8.5s', '2.7s', 1],
  [280, 420, 2, '-2px', '-14px', '7.7s', '3.9s', 0],
  [60, 380, 1.8, '11px', '-8px', '9.3s', '5.1s', 0],
]

/** Palettes, read straight off each design page. */
export const PARTICLE_PALETTES = {
  ai: ['#2B49DB', '#5B7BF0', '#28C76F'],
  bt: ['#F4C430', '#FFE38A', '#28C76F'],
  de: ['#2B8FDB', '#8FD6FF', '#28C76F'],
  dx: ['#28C76F', '#6FDBA0', '#2B49DB'],
  gt: ['#3E5FE0', '#A9BBFF', '#28C76F'],
  // The two platform pages reuse the same field in their brand colours.
  zh: ['#E42527', '#FFACA6', '#28C76F'],
  sf: ['#00A1E0', '#8FD6F5', '#28C76F'],
} as const

export type ParticlePalette = keyof typeof PARTICLE_PALETTES

export function ParticleField({ prefix }: { prefix: ParticlePalette }) {
  const palette = PARTICLE_PALETTES[prefix]

  return (
    <svg className={`${prefix}-particles`} viewBox="0 0 520 480" aria-hidden="true">
      {PARTICLES.map(([cx, cy, r, dx, dy, dur, delay, tone], index) => (
        <circle
          key={index}
          className={`${prefix}-particle`}
          cx={cx}
          cy={cy}
          r={r}
          fill={palette[tone]}
          style={
            {
              '--dx': dx,
              '--dy': dy,
              '--dur': dur,
              '--delay': delay,
            } as React.CSSProperties
          }
        />
      ))}
    </svg>
  )
}
