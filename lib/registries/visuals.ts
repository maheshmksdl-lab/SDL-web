/* Hero visual registry — which visual a hero block renders.
 *
 * Generated from the design's own data by tools/visual-parity/gen-registries.mjs.
 * Source: the nine design pages: index (canvas), services (DNA helix), the six service pages, evoq
 *
 * The CMS stores the KEY; this file owns the artwork. Editors never paste SVG.
 * Each registry exports its lookup and an `options` array — cms/src/lib imports the same
 * options so an admin dropdown cannot drift from the code that renders it. */

export const heroVisuals = [
  { value: 'home-canvas',   label: 'Home — particle canvas',      page: 'index' },
  { value: 'services-dna',  label: 'Services — DNA helix',        page: 'services' },
  { value: 'ai-orb',        label: 'AI — grain orb + particles',  page: 'ai-transformation' },
  { value: 'bt-arc',        label: 'Business — rotating arc',     page: 'business-transformation' },
  { value: 'de-hex',        label: 'Engineering — hex lattice',   page: 'digital-engineering' },
  { value: 'dx-cursor',     label: 'Experience — cursor motif',   page: 'digital-experience' },
  { value: 'gt-chart',      label: 'Growth — rising chart',       page: 'growth-transformation' },
  { value: 'wae-windows',   label: 'Sub-service — stacked windows', page: 'web-application-engineering' },
  { value: 'ce-cloud',      label: 'Cloud engineering — cloud + nodes', page: 'cloud-engineering' },
  { value: 'me-phone',      label: 'Mobile engineering — phone mockup', page: 'mobile-engineering' },
  { value: 'qe-pipeline',   label: 'Quality engineering — release pipeline', page: 'quality-engineering' },
  { value: 'evoq-suite',    label: 'EVOQ — team photo (upload it as the hero image)', page: 'evoq' },
  { value: 'zh-logo-card',  label: 'Zoho — partner logo card (upload the logo as the hero image)', page: 'zoho-consulting-implementation' },
  { value: 'sf-logo-card',  label: 'Salesforce — logo card (upload the logo as the hero image)', page: 'salesforce-implementation' },
  { value: 'none',          label: 'No visual (copy only)',       page: null },
] as const

export type HeroVisual = (typeof heroVisuals)[number]['value']

export const heroVisualOptions = heroVisuals.map(({ value, label }) => ({ value, label }))
