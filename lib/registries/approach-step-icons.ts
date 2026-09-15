/**
 * "From potential to impact." (home page, `#approach`) — each step's icon is a bespoke,
 * multi-coloured particle/constellation diagram, not a single-colour glyph, so it does not fit
 * the shared icon registry (`icons.ts`). This block appears exactly once, with exactly these
 * four steps in this fixed order, so the artwork is looked up by position rather than by a
 * stored key — the same positional pattern used for `deCapShapeColors`.
 *
 * Verbatim from index.html's four `.sdl-explain-icon` SVGs.
 */
export const approachStepIcons: string[] = [
  `<circle cx="14" cy="18" r="3" fill="#2DD4BF"/>
   <circle cx="34" cy="10" r="2.4" fill="#60A5FA"/>
   <circle cx="52" cy="24" r="3.2" fill="#4F76F6"/>
   <circle cx="20" cy="42" r="2.6" fill="#22D3EE"/>
   <circle cx="46" cy="46" r="2.2" fill="#7C6BF0"/>
   <circle cx="66" cy="14" r="2.6" fill="#38BDF8"/>
   <circle cx="72" cy="40" r="3" fill="#2DD4BF"/>
   <circle cx="8" cy="58" r="2.2" fill="#60A5FA"/>
   <circle cx="30" cy="64" r="2.8" fill="#4F76F6"/>
   <circle cx="58" cy="60" r="2.4" fill="#22D3EE"/>
   <circle cx="86" cy="26" r="2.4" fill="#7C6BF0"/>
   <circle cx="80" cy="58" r="2.2" fill="#38BDF8"/>
   <circle cx="42" cy="30" r="1.8" fill="#2DD4BF"/>
   <circle cx="60" cy="36" r="2" fill="#60A5FA"/>`,
  `<g stroke="#8FB6F5" stroke-width="1" opacity="0.8">
     <line x1="10" y1="14" x2="92" y2="40"/>
     <line x1="16" y1="60" x2="92" y2="40"/>
     <line x1="30" y1="10" x2="92" y2="40"/>
     <line x1="8" y1="40" x2="92" y2="40"/>
     <line x1="40" y1="64" x2="92" y2="40"/>
     <line x1="46" y1="16" x2="92" y2="40"/>
   </g>
   <circle cx="10" cy="14" r="2.6" fill="#60A5FA"/>
   <circle cx="16" cy="60" r="2.6" fill="#4F76F6"/>
   <circle cx="30" cy="10" r="2.2" fill="#22D3EE"/>
   <circle cx="8" cy="40" r="2.4" fill="#7C6BF0"/>
   <circle cx="40" cy="64" r="2.2" fill="#38BDF8"/>
   <circle cx="46" cy="16" r="2" fill="#2DD4BF"/>
   <circle cx="92" cy="40" r="4.5" fill="#2FD4C4"/>`,
  `<circle cx="96" cy="40" r="12" fill="#38BDF8" opacity="0.14"/>
   <g stroke="#3E7BF2" stroke-width="1.4" opacity="0.9">
     <line x1="14" y1="20" x2="96" y2="40"/>
     <line x1="14" y1="60" x2="96" y2="40"/>
     <line x1="30" y1="12" x2="96" y2="40"/>
     <line x1="30" y1="68" x2="96" y2="40"/>
   </g>
   <circle cx="14" cy="20" r="2.6" fill="#4F76F6"/>
   <circle cx="14" cy="60" r="2.6" fill="#4F76F6"/>
   <circle cx="30" cy="12" r="2.2" fill="#38BDF8"/>
   <circle cx="30" cy="68" r="2.2" fill="#38BDF8"/>
   <circle cx="96" cy="40" r="5" fill="#2FE0C8"/>`,
  `<circle cx="20" cy="32" r="2.4" fill="#7DD8F0"/>
   <circle cx="20" cy="40" r="2.4" fill="#7DD8F0"/>
   <circle cx="20" cy="48" r="2.4" fill="#7DD8F0"/>
   <circle cx="34" cy="32" r="2.6" fill="#5AB4EA"/>
   <circle cx="34" cy="40" r="2.6" fill="#5AB4EA"/>
   <circle cx="34" cy="48" r="2.6" fill="#5AB4EA"/>
   <circle cx="48" cy="32" r="2.8" fill="#4A93E8"/>
   <circle cx="48" cy="40" r="2.8" fill="#4A93E8"/>
   <circle cx="48" cy="48" r="2.8" fill="#4A93E8"/>
   <circle cx="56" cy="20" r="2.6" fill="#3E7BF2"/>
   <circle cx="56" cy="40" r="3" fill="#3E7BF2"/>
   <circle cx="56" cy="60" r="2.6" fill="#3E7BF2"/>
   <circle cx="68" cy="24" r="2.8" fill="#3568E8"/>
   <circle cx="68" cy="40" r="3.2" fill="#3568E8"/>
   <circle cx="68" cy="56" r="2.8" fill="#3568E8"/>
   <circle cx="80" cy="28" r="3" fill="#2E52D8"/>
   <circle cx="80" cy="40" r="3.4" fill="#2E52D8"/>
   <circle cx="80" cy="52" r="3" fill="#2E52D8"/>
   <circle cx="92" cy="34" r="3.2" fill="#2C3FC8"/>
   <circle cx="92" cy="40" r="3.6" fill="#2C3FC8"/>
   <circle cx="92" cy="46" r="3.2" fill="#2C3FC8"/>
   <circle cx="102" cy="40" r="4" fill="#2C2C9E"/>`,
]
