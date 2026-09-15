/* Colour ramps — per-card accent pairs and insight-card swatches.
 *
 * Generated from the design's own data by tools/visual-parity/gen-registries.mjs.
 * Source: PILLAR_MOTIF_COLORS, INSIGHT_COLORS, *_CAP_SHAPE_COLORS, *_ACCENT_COLORS
 *
 * The CMS stores the KEY; this file owns the artwork. Editors never paste SVG.
 * Each registry exports its lookup and an `options` array — cms/src/lib imports the same
 * options so an admin dropdown cannot drift from the code that renders it. */

export const pillarMotifColors = [["#7C97FF","#2B49DB"],["#8FD6FF","#2B8FDB"],["#FFE38A","#F4C430"],["#6FDBA0","#28C76F"],["#A9BBFF","#3E5FE0"],["#9BEFC4","#22B368"]] as const

export const insightColors = [{"bg":"var(--success)","text":"dark"},{"bg":"var(--attention)","text":"dark"},{"bg":"var(--accent)","text":"light"}] as const

export const capShapeColors = [["#7C97FF","#2B49DB"],["#6FDBA0","#28C76F"],["#FFE38A","#F4C430"],["#8FD6FF","#2B8FDB"],["#A9BBFF","#3E5FE0"],["#9BEFC4","#22B368"]] as const

export const btCapShapeColors = [["#FFE38A","#F4C430"],["#8FD6FF","#2B8FDB"],["#6FDBA0","#28C76F"],["#7C97FF","#2B49DB"],["#FFD199","#E68A2E"],["#9BEFC4","#22B368"],["#FFB199","#E64A3C"]] as const

export const deCapShapeColors = [["#8FD6FF","#2B8FDB"],["#7C97FF","#2B49DB"],["#6FDBA0","#28C76F"],["#FFE38A","#F4C430"]] as const

export const deValueAccentColors = ["#2B8FDB","#2B49DB","#28C76F","#F4C430","#3E5FE0","#22B368"] as const

export const deTechAccents = [{"solid":"#2B8FDB","gradA":"rgba(43,143,219,0.20)","gradB":"rgba(43,143,219,0.05)","soft":"rgba(43,143,219,0.14)"},{"solid":"#2B49DB","gradA":"rgba(43,73,219,0.20)","gradB":"rgba(43,73,219,0.05)","soft":"rgba(43,73,219,0.14)"},{"solid":"#28C76F","gradA":"rgba(40,199,111,0.20)","gradB":"rgba(40,199,111,0.05)","soft":"rgba(40,199,111,0.14)"},{"solid":"#C9941F","gradA":"rgba(244,196,48,0.24)","gradB":"rgba(244,196,48,0.06)","soft":"rgba(201,148,31,0.14)"},{"solid":"#3E5FE0","gradA":"rgba(62,95,224,0.20)","gradB":"rgba(62,95,224,0.05)","soft":"rgba(62,95,224,0.14)"},{"solid":"#22B368","gradA":"rgba(34,179,104,0.20)","gradB":"rgba(34,179,104,0.05)","soft":"rgba(34,179,104,0.14)"}] as const

export const dxCapShapeColors = [["#6FDBA0","#28C76F"],["#8FD6FF","#2B8FDB"],["#FFE38A","#F4C430"],["#7C97FF","#2B49DB"],["#9BEFC4","#22B368"],["#A9BBFF","#3E5FE0"]] as const

export const gtCapShapeColors = [["#A9BBFF","#3E5FE0"],["#8FD6FF","#2B8FDB"],["#FFE38A","#F4C430"],["#7C97FF","#2B49DB"],["#6FDBA0","#28C76F"],["#9BEFC4","#22B368"]] as const

export const waeAccentColors = ["#2B8FDB","#2B49DB","#28C76F","#F4C430","#3E5FE0","#22B368","#DB2777"] as const

export const ceAccentColors = ["#0EA5E9","#2B49DB","#28C76F","#F4C430","#3E5FE0","#22B368","#7C6FF0"] as const

export const meAccentColors = ["#22B368","#2B8FDB","#2B49DB","#F4C430","#3E5FE0","#28C76F"] as const

export const qeAccentColors = ["#C9941F","#2B49DB","#28C76F","#2B8FDB","#3E5FE0","#22B368","#7C6FF0"] as const

export const evoqProductColors = {"CRM":"#2554EB","Campaigns":"#6D4FEB","Practice Management":"#0D9488","ServiceOps":"#F5A123","Desk":"#0E8C82","Projects":"#6D4FEB","Sync":"#0E9F6E","Inventory":"#0E8C9E","CPQ":"#EA580C","Billing":"#7C6EF0","HRMS":"#1B7A4D","Skillberry":"#E94E77"} as const

export const zhCapShapeColors = [["#FFACA6","#E42527"],["#8FD6FF","#2B8FDB"],["#6FDBA0","#28C76F"],["#7C97FF","#2B49DB"],["#FFD199","#E68A2E"],["#9BEFC4","#22B368"],["#FFB199","#E64A3C"]] as const

export const sfCapShapeColors = [["#8FD6F5","#00A1E0"],["#8FD6FF","#2B8FDB"],["#6FDBA0","#28C76F"],["#7C97FF","#2B49DB"],["#FFD199","#E68A2E"],["#9BEFC4","#22B368"],["#FFB199","#E64A3C"]] as const

/** Ramps cycle when a list is longer than the ramp. */
export function pick<T>(ramp: readonly T[], index: number): T {
  return ramp[index % ramp.length] as T
}
