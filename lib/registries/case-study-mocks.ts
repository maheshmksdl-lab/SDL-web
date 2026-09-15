/**
 * Case-study illustrations — the mock UI beside each page's "Selected work" / case-study copy.
 * Every page's version is bespoke, illustrative markup, not a real screenshot, so it lives here
 * rather than as a CMS-authored field — the same category as the EVOQ product mocks and the
 * AI-engineering step mocks.
 *
 * The frame around it (`.<theme>-case`, `.<theme>-case-media`, `.<theme>-case-title`, …) is built
 * by the `CaseStudy` component from the page theme; only the illustration inside the media box
 * differs per page, which is what this registry supplies — keyed by page, in that page's own class
 * prefix. Cloud and quality engineering have no wrapper at all in the design (their stat panels
 * sit directly in the media box), so `mockClassName` is optional.
 */

export type CaseStudyMock = {
  /**
   * The illustration's own wrapper (`.bt-case-mock`, `.me-case-phone`), which carries its role and
   * label. Omitted for cloud and quality engineering, whose stat panels sit directly in the
   * page's `.<theme>-case-media`.
   */
  mockClassName?: string
  /** The design's own `aria-label` for the illustration. Falls back to the case title. */
  label?: string
  html: string
}

const SPARK_ICON =
  '<svg class="ai-mock-spark" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z"/></svg>'

const chromeBar = (pillClass: string) =>
  `<div class="${pillClass.replace('-pill', '-bar')}"><span></span><span></span><span></span><div class="${pillClass}"></div></div>`

export const caseStudyMocks: Record<string, CaseStudyMock> = {
  'ai-transformation': {
    mockClassName: 'ai-case-mock',
    label: 'Illustration of an AI assistant suggesting a reply inside a support workflow',
    html:
      chromeBar('ai-mock-pill') +
      '<div class="ai-mock-body">' +
      '<div class="ai-mock-side">' +
      '<div class="ai-mock-row is-active"><i></i><b></b></div>' +
      '<div class="ai-mock-row"><i></i><b style="width:70%"></b></div>' +
      '<div class="ai-mock-row"><i></i><b style="width:84%"></b></div>' +
      '<div class="ai-mock-row"><i></i><b style="width:60%"></b></div>' +
      '<div class="ai-mock-row"><i></i><b style="width:76%"></b></div>' +
      '</div>' +
      '<div class="ai-mock-main">' +
      '<div class="ai-mock-msg"></div>' +
      '<div class="ai-mock-msg ai-mock-msg--out"></div>' +
      '<div class="ai-mock-suggest">' +
      `<div class="ai-mock-suggest-head">${SPARK_ICON}Suggested reply</div>` +
      '<div class="ai-mock-lines"><span></span><span></span><span style="width:64%"></span></div>' +
      '<div class="ai-mock-actions"><span class="ai-mock-btn"></span><span class="ai-mock-btn ai-mock-btn--ghost"></span></div>' +
      '</div>' + // .ai-mock-suggest
      '</div>' + // .ai-mock-main
      '</div>', // .ai-mock-body
  },

  'business-transformation': {
    mockClassName: 'bt-case-mock',
    label: 'Illustration of previously disconnected sales, service, finance and operations systems connected through one unified business application',
    html:
      chromeBar('bt-mock-pill') +
      '<div class="bt-mock-network">' +
      '<svg class="bt-mock-lines" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true">' +
      '<line x1="150" y1="100" x2="46" y2="36" stroke="#F4C430" stroke-width="1.5"/>' +
      '<line x1="150" y1="100" x2="254" y2="36" stroke="#F4C430" stroke-width="1.5"/>' +
      '<line x1="150" y1="100" x2="46" y2="164" stroke="#F4C430" stroke-width="1.5"/>' +
      '<line x1="150" y1="100" x2="254" y2="164" stroke="#F4C430" stroke-width="1.5"/>' +
      '</svg>' +
      '<div class="bt-mock-node" style="top:8%;left:6%;">Sales</div>' +
      '<div class="bt-mock-node" style="top:8%;right:6%;">Service</div>' +
      '<div class="bt-mock-node" style="bottom:8%;left:6%;">Finance</div>' +
      '<div class="bt-mock-node" style="bottom:8%;right:6%;">Ops</div>' +
      '<div class="bt-mock-hub">Unified<br/>platform</div>' +
      '</div>',
  },

  'digital-experience': {
    mockClassName: 'dx-case-mock',
    html:
      chromeBar('dx-mock-pill') +
      '<div class="dx-mock-flow">' +
      '<div class="dx-mock-step is-done"><span class="dx-mock-step-dot">1</span>Details</div>' +
      '<div class="dx-mock-step-line"></div>' +
      '<div class="dx-mock-step is-done"><span class="dx-mock-step-dot">2</span>Review</div>' +
      '<div class="dx-mock-step-line"></div>' +
      '<div class="dx-mock-step is-active"><span class="dx-mock-step-dot">3</span>Done</div>' +
      '</div>' +
      '<div class="dx-mock-panels">' +
      '<div class="dx-mock-panel"><div class="dx-mock-stat">+38%</div><div class="dx-mock-stat-label">Task completion</div></div>' +
      '<div class="dx-mock-panel"><div class="dx-mock-stat">−52%</div><div class="dx-mock-stat-label">Drop-off rate</div></div>' +
      '</div>',
  },

  'growth-transformation': {
    mockClassName: 'gt-case-mock',
    html:
      chromeBar('gt-mock-pill') +
      '<div class="gt-mock-funnel">' +
      '<div class="gt-mock-funnel-stage" style="width:92%">Visitors</div>' +
      '<div class="gt-mock-funnel-stage" style="width:64%">Leads</div>' +
      '<div class="gt-mock-funnel-stage" style="width:38%">Customers</div>' +
      '</div>' +
      '<div class="gt-mock-panels">' +
      '<div class="gt-mock-panel"><div class="gt-mock-stat">+64%</div><div class="gt-mock-stat-label">Organic traffic</div></div>' +
      '<div class="gt-mock-panel"><div class="gt-mock-stat">2.1×</div><div class="gt-mock-stat-label">Lead conversion</div></div>' +
      '</div>',
  },

  'digital-engineering': {
    mockClassName: 'de-case-mock',
    label: 'Illustration of a modernized deployment pipeline moving from build through test to deploy, alongside uptime and release-speed metrics',
    html:
      chromeBar('de-mock-pill') +
      '<div class="de-mock-pipeline">' +
      '<div class="de-mock-stage is-done"><span class="de-mock-stage-dot"></span>Build</div>' +
      '<div class="de-mock-stage-line"></div>' +
      '<div class="de-mock-stage is-done"><span class="de-mock-stage-dot"></span>Test</div>' +
      '<div class="de-mock-stage-line"></div>' +
      '<div class="de-mock-stage is-active"><span class="de-mock-stage-dot"></span>Deploy</div>' +
      '</div>' +
      '<div class="de-mock-panels">' +
      '<div class="de-mock-panel"><div class="de-mock-stat">99.9%</div><div class="de-mock-stat-label">Platform uptime</div></div>' +
      '<div class="de-mock-panel"><div class="de-mock-stat">4×</div><div class="de-mock-stat-label">Faster release cycles</div></div>' +
      '</div>',
  },

  'web-application-engineering': {
    mockClassName: 'wae-case-mock',
    label: 'Illustration of a modernized customer portal showing improved page-load and Lighthouse performance scores',
    html:
      '<div class="wae-case-window-bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="wae-case-url"></span></div>' +
      '<div class="wae-case-panels">' +
      '<div class="wae-case-panel"><div class="wae-case-stat">0.9s</div><div class="wae-case-stat-label">Page load time<br/>(was 3.2s)</div></div>' +
      '<div class="wae-case-panel"><div class="wae-case-stat">96</div><div class="wae-case-stat-label">Lighthouse score<br/>(was 62)</div></div>' +
      '</div>',
  },

  'cloud-engineering': {
    html:
      '<div class="ce-case-panel"><div class="ce-case-stat">3×</div><div class="ce-case-stat-label">Peak traffic handled</div></div>' +
      '<div class="ce-case-panel"><div class="ce-case-stat">40%</div><div class="ce-case-stat-label">Lower infrastructure cost</div></div>',
  },

  'mobile-engineering': {
    mockClassName: 'me-case-phone',
    label: 'Illustration of a field service mobile app showing job completion and error-reduction metrics',
    html:
      '<div class="me-case-phone-screen">' +
      '<div class="me-case-phone-notch"></div>' +
      '<div class="me-case-panel"><div class="me-case-stat">98%</div><div class="me-case-stat-label">Field job completion</div></div>' +
      '<div class="me-case-panel"><div class="me-case-stat">0</div><div class="me-case-stat-label">Manual re-entry errors</div></div>' +
      '</div>',
  },

  'quality-engineering': {
    html:
      '<div class="qe-case-panel"><div class="qe-case-stat">89%</div><div class="qe-case-stat-label">Test coverage</div></div>' +
      '<div class="qe-case-panel"><div class="qe-case-stat">70%</div><div class="qe-case-stat-label">Fewer production defects</div></div>',
  },

  'zoho-consulting-implementation': {
    mockClassName: 'zh-case-mock',
    label:
      'Illustration of previously disconnected sales, service, finance and operations systems connected through one Zoho environment',
    html:
      chromeBar('zh-mock-pill') +
      '<div class="zh-mock-network">' +
      '<svg class="zh-mock-lines" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true">' +
      '<line x1="150" y1="100" x2="46" y2="36" stroke="#E42527" stroke-width="1.5"/>' +
      '<line x1="150" y1="100" x2="254" y2="36" stroke="#E42527" stroke-width="1.5"/>' +
      '<line x1="150" y1="100" x2="46" y2="164" stroke="#E42527" stroke-width="1.5"/>' +
      '<line x1="150" y1="100" x2="254" y2="164" stroke="#E42527" stroke-width="1.5"/>' +
      '</svg>' +
      '<div class="zh-mock-node" style="top:8%; left:6%;">CRM</div>' +
      '<div class="zh-mock-node" style="top:8%; right:6%;">Service</div>' +
      '<div class="zh-mock-node" style="bottom:8%; left:6%;">Finance</div>' +
      '<div class="zh-mock-node" style="bottom:8%; right:6%;">Ops</div>' +
      '<div class="zh-mock-hub">Zoho<br/>environment</div>' +
      '</div>',
  },

  'salesforce-implementation': {
    mockClassName: 'sf-case-mock',
    label:
      'Illustration of previously disconnected sales, service and account data connected through one Salesforce implementation',
    html:
      chromeBar('sf-mock-pill') +
      '<div class="sf-mock-network">' +
      '<svg class="sf-mock-lines" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true">' +
      '<line x1="150" y1="100" x2="46" y2="36" stroke="#00A1E0" stroke-width="1.5"/>' +
      '<line x1="150" y1="100" x2="254" y2="36" stroke="#00A1E0" stroke-width="1.5"/>' +
      '<line x1="150" y1="100" x2="46" y2="164" stroke="#00A1E0" stroke-width="1.5"/>' +
      '<line x1="150" y1="100" x2="254" y2="164" stroke="#00A1E0" stroke-width="1.5"/>' +
      '</svg>' +
      '<div class="sf-mock-node" style="top:8%; left:6%;">Sales</div>' +
      '<div class="sf-mock-node" style="top:8%; right:6%;">Service</div>' +
      '<div class="sf-mock-node" style="bottom:8%; left:6%;">Accounts</div>' +
      '<div class="sf-mock-node" style="bottom:8%; right:6%;">Reporting</div>' +
      '<div class="sf-mock-hub">Salesforce<br/>platform</div>' +
      '</div>',
  },
}

export function getCaseStudyMock(key?: string | null): CaseStudyMock | null {
  if (!key) return null
  return caseStudyMocks[key] ?? null
}
