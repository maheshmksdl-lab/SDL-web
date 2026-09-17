/**
 * Cache tags.
 *
 * Every fetch declares the tags it depends on; the CMS names the same tags when content changes
 * (cms/src/hooks/revalidate.ts → POST /api/revalidate). Keeping the vocabulary in one file is
 * what stops a publish quietly failing to invalidate a page because a tag was typed differently
 * on the two sides.
 */

export const tags = {
  /** One page, by its pathname. `/services/ai-transformation` → `page:/services/ai-transformation` */
  page: (pathname: string) => `page:${pathname}`,
  /** Any page changing — used for listings and generateStaticParams. */
  pages: 'pages',

  insights: 'insights',
  insight: (slug: string) => `insight:${slug}`,
  insightCategories: 'insight-categories',

  services: 'services',
  products: 'products',
  caseStudies: 'case-studies',
  clients: 'clients',
  testimonials: 'testimonials',
  redirects: 'redirects',

  form: (slug: string) => `form:${slug}`,
  forms: 'forms',

  global: (slug: 'header' | 'footer' | 'site-settings') => `global:${slug}`,
} as const

/**
 * How long a cached entry survives with no invalidation.
 *
 * The revalidation webhook is the primary mechanism; this is the safety net for the case where
 * it fails silently (the CMS logs and continues rather than failing a publish). An hour is short
 * enough that a missed webhook is an inconvenience rather than an incident, and long enough that
 * normal traffic never hits the CMS.
 */
export const REVALIDATE_SECONDS = 3600
