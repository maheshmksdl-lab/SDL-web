/**
 * Route loading state.
 *
 * Skeleton blocks at the hero's real proportions rather than a spinner, so the layout does not
 * jump when content arrives. CLS is a budgeted metric (plan §6.12).
 */
export default function Loading() {
  return (
    <main id="main" className="sdl-page" aria-busy="true" aria-live="polite">
      <span className="sdl-visually-hidden">Loading</span>
      <section className="sdl-hero" aria-hidden="true">
        <div className="sdl-hero-copy-wrap">
          <div className="sdl-skeleton" style={{ height: 58, width: '80%' }} />
          <div className="sdl-skeleton" style={{ height: 58, width: '65%', marginTop: 12 }} />
          <div className="sdl-skeleton" style={{ height: 20, width: '55%', marginTop: 28 }} />
          <div className="sdl-skeleton" style={{ height: 20, width: '45%', marginTop: 10 }} />
          <div className="sdl-skeleton" style={{ height: 52, width: 220, marginTop: 44, borderRadius: 999 }} />
        </div>
        <div className="sdl-hero-visual">
          <div className="sdl-skeleton" style={{ width: '100%', aspectRatio: '520 / 480' }} />
        </div>
      </section>
    </main>
  )
}
