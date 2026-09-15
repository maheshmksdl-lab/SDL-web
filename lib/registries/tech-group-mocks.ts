/**
 * digital-engineering.html's `deTechMockBody(mockType)` — the illustrative "app preview" body
 * inside the technology-expertise section's active-category window. Purely decorative, keyed by
 * `mockType` only (never by which group is active), so it lives here rather than as CMS content.
 */
export const techGroupMocks: Record<string, string> = {
  ui:
    '<div class="de-tech-mock-nav"></div>' +
    '<div class="de-tech-mock-main">' +
    '<div class="de-tech-mock-hero"></div>' +
    '<div class="de-tech-mock-line w80"></div>' +
    '<div class="de-tech-mock-line w55"></div>' +
    '<div class="de-tech-mock-line w40"></div>' +
    '</div>',
  server:
    '<div class="de-tech-mock-node"><span class="de-tech-mock-node-dot"></span><span class="de-tech-mock-node-bar" style="width:70%"></span></div>' +
    '<div class="de-tech-mock-node"><span class="de-tech-mock-node-dot"></span><span class="de-tech-mock-node-bar" style="width:45%"></span></div>' +
    '<div class="de-tech-mock-node"><span class="de-tech-mock-node-dot"></span><span class="de-tech-mock-node-bar" style="width:58%"></span></div>',
  code:
    '<div class="de-tech-mock-code-line"><span class="de-tech-mock-code-chunk a" style="width:26%"></span><span class="de-tech-mock-code-chunk b" style="width:34%"></span></div>' +
    '<div class="de-tech-mock-code-line" style="padding-left:14px"><span class="de-tech-mock-code-chunk c" style="width:40%"></span></div>' +
    '<div class="de-tech-mock-code-line" style="padding-left:14px"><span class="de-tech-mock-code-chunk b" style="width:22%"></span><span class="de-tech-mock-code-chunk c" style="width:30%"></span></div>' +
    '<div class="de-tech-mock-code-line"><span class="de-tech-mock-code-chunk a" style="width:18%"></span><span class="de-tech-mock-code-chunk b" style="width:16%"></span></div>',
  split:
    '<div class="de-tech-mock-split-col">' +
    '<div class="de-tech-mock-hero" style="height:36px"></div>' +
    '<div class="de-tech-mock-line w80"></div>' +
    '<div class="de-tech-mock-line w55"></div>' +
    '</div>' +
    '<div class="de-tech-mock-split-divider"></div>' +
    '<div class="de-tech-mock-split-col">' +
    '<div class="de-tech-mock-node" style="padding:8px 10px"><span class="de-tech-mock-node-dot"></span><span class="de-tech-mock-node-bar"></span></div>' +
    '<div class="de-tech-mock-node" style="padding:8px 10px"><span class="de-tech-mock-node-dot"></span><span class="de-tech-mock-node-bar"></span></div>' +
    '</div>',
  cms:
    '<div class="de-tech-mock-cms-row"><span class="de-tech-mock-cms-thumb"></span>' +
    '<div class="de-tech-mock-cms-lines"><div class="de-tech-mock-line w80"></div><div class="de-tech-mock-line w40"></div></div>' +
    '<span class="de-tech-mock-cms-tag">Live</span></div>' +
    '<div class="de-tech-mock-cms-row"><span class="de-tech-mock-cms-thumb"></span>' +
    '<div class="de-tech-mock-cms-lines"><div class="de-tech-mock-line w55"></div><div class="de-tech-mock-line w40"></div></div>' +
    '<span class="de-tech-mock-cms-tag">Draft</span></div>' +
    '<div class="de-tech-mock-cms-row"><span class="de-tech-mock-cms-thumb"></span>' +
    '<div class="de-tech-mock-cms-lines"><div class="de-tech-mock-line w80"></div><div class="de-tech-mock-line w55"></div></div>' +
    '<span class="de-tech-mock-cms-tag">Live</span></div>',
  graph:
    '<svg width="100%" height="90" viewBox="0 0 220 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<line x1="30" y1="45" x2="110" y2="20" style="stroke:var(--tech-accent);stroke-width:2;opacity:0.35"/>' +
    '<line x1="30" y1="45" x2="110" y2="70" style="stroke:var(--tech-accent);stroke-width:2;opacity:0.35"/>' +
    '<line x1="110" y1="20" x2="190" y2="45" style="stroke:var(--tech-accent);stroke-width:2;opacity:0.35"/>' +
    '<line x1="110" y1="70" x2="190" y2="45" style="stroke:var(--tech-accent);stroke-width:2;opacity:0.35"/>' +
    '<circle cx="30" cy="45" r="10" style="fill:var(--tech-accent)"/>' +
    '<circle cx="110" cy="20" r="8" style="fill:#FFFFFF;stroke:var(--tech-accent);stroke-width:2"/>' +
    '<circle cx="110" cy="70" r="8" style="fill:#FFFFFF;stroke:var(--tech-accent);stroke-width:2"/>' +
    '<circle cx="190" cy="45" r="10" style="fill:var(--tech-accent)"/>' +
    '</svg>',
}

export function getTechGroupMock(mockType: string): string {
  return techGroupMocks[mockType] ?? techGroupMocks.ui!
}
