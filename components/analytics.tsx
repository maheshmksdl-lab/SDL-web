import Script from 'next/script'

import type { SiteSetting } from '@/lib/payload-types'

/**
 * Analytics tags, driven by Site Settings (plan §4.12).
 *
 * Only loads in the production environment — a staging or preview deploy must not send hits to
 * the real property. IDs come from the CMS first, then the NEXT_PUBLIC_* env vars as a fallback,
 * so a value can be set either way.
 *
 * `next/script` with `strategy="afterInteractive"` keeps these off the critical path; none of
 * them block LCP.
 */

const IS_PRODUCTION = process.env.NEXT_PUBLIC_ENV === 'production'

export function Analytics({ settings }: { settings: SiteSetting }) {
  if (!IS_PRODUCTION) return null

  const ga = settings.googleAnalyticsId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''
  const gtm = settings.googleTagManagerId || process.env.NEXT_PUBLIC_GTM_ID || ''
  const linkedIn = settings.linkedinPartnerId || ''

  if (!ga && !gtm && !linkedIn) return null

  return (
    <>
      {gtm ? (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`}
        </Script>
      ) : null}

      {ga ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}',{anonymize_ip:true});`}
          </Script>
        </>
      ) : null}

      {linkedIn ? (
        <Script id="linkedin-insight" strategy="afterInteractive">
          {`_linkedin_partner_id="${linkedIn}";window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];window._linkedin_data_partner_ids.push(_linkedin_partner_id);(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}var s=document.getElementsByTagName("script")[0];var b=document.createElement("script");b.type="text/javascript";b.async=true;b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";s.parentNode.insertBefore(b,s);})(window.lintrk);`}
        </Script>
      ) : null}
    </>
  )
}
