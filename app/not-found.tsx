import Link from 'next/link'

export default function NotFound() {
  return (
    <main id="main" className="sdl-page">
      <section className="sdl-section sdl-section--white">
        <div className="sdl-section-inner" style={{ textAlign: 'center', padding: '80px 0' }}>
          <div className="sdl-kicker" style={{ justifyContent: 'center' }}>404</div>
          <h1 className="sdl-section-title" style={{ marginTop: 18 }}>
            We couldn&rsquo;t find that page.
          </h1>
          <p className="sdl-section-sub" style={{ margin: '16px auto 0', maxWidth: 520 }}>
            The link may be out of date, or the page may have moved.
          </p>
          <div style={{ marginTop: 32 }}>
            <Link href="/" className="sdl-hero-primary">
              Back to the homepage →
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
