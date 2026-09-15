/**
 * Fails the build when a required environment variable is missing, or when a production build
 * is pointed at a localhost URL.
 *
 * Pattern copied from the EFTMRA reference's `verify:deployment-env`. Run in CI before `build`.
 * See plan §8.5.
 *
 *   pnpm verify:env
 *   NEXT_PUBLIC_ENV=production NODE_ENV=production pnpm verify:env
 */
import 'dotenv/config'

type Rule = {
  name: string
  required: 'always' | 'production'
  check?: (value: string) => string | null
}

// The public site's "production" is NEXT_PUBLIC_ENV — NODE_ENV is `production` for any
// `next build`, including a staging one.
const isProduction = process.env.NEXT_PUBLIC_ENV === 'production'

const notLocalhostInProd: Rule['check'] = (value) =>
  isProduction && /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(value)
    ? 'must not point at localhost in a production build'
    : null

const isHttpsInProd: Rule['check'] = (value) =>
  isProduction && !/^https:\/\//i.test(value) ? 'must be an https:// URL in production' : null

const RULES: Rule[] = [
  {
    name: 'NEXT_PUBLIC_CMS_URL',
    required: 'always',
    check: (v) => notLocalhostInProd(v) ?? isHttpsInProd(v),
  },
  {
    name: 'NEXT_PUBLIC_SITE_URL',
    required: 'always',
    check: (v) => notLocalhostInProd(v) ?? isHttpsInProd(v),
  },
  { name: 'NEXT_PUBLIC_ENV', required: 'always' },
  {
    name: 'REVALIDATE_SECRET',
    required: 'always',
    check: (v) => (v.length < 16 ? 'must be at least 16 characters' : null),
  },
  {
    name: 'PREVIEW_SECRET',
    required: 'always',
    check: (v) => (v.length < 16 ? 'must be at least 16 characters' : null),
  },
  // The preview workflow cannot authenticate a draft read without this — but published content
  // still renders, so it is only mandatory in production where preview is expected to work.
  { name: 'CMS_API_KEY', required: 'production' },
]

const errors: string[] = []
const warnings: string[] = []

for (const rule of RULES) {
  const value = process.env[rule.name]?.trim()
  const required = rule.required === 'always' || (rule.required === 'production' && isProduction)

  if (!value) {
    if (required) errors.push(`${rule.name} is not set`)
    continue
  }

  const problem = rule.check?.(value)
  if (problem) errors.push(`${rule.name} ${problem}`)
}

// reCAPTCHA is optional, but a half-configured pair silently disables verification.
const hasSite = Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim())
const hasSecret = Boolean(process.env.RECAPTCHA_SECRET_KEY?.trim())
if (hasSite !== hasSecret) {
  warnings.push(
    'reCAPTCHA is half-configured — set both NEXT_PUBLIC_RECAPTCHA_SITE_KEY and RECAPTCHA_SECRET_KEY, or neither',
  )
}

for (const w of warnings) console.warn(`  ⚠ ${w}`)

if (errors.length) {
  console.error('\n  Environment check failed:\n')
  for (const e of errors) console.error(`    ✗ ${e}`)
  console.error(`\n  (NEXT_PUBLIC_ENV=${process.env.NEXT_PUBLIC_ENV ?? 'undefined'})\n`)
  process.exit(1)
}

console.log(`  ✓ environment OK (NEXT_PUBLIC_ENV=${process.env.NEXT_PUBLIC_ENV ?? 'development'})`)
