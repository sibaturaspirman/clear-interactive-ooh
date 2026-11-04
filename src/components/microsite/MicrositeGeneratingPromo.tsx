/** Copy on submit loading overlay — event teaser above “Please wait”. */
export function MicrositeGeneratingPromo() {
  return (
    <div className="microsite-generating-promo">
      <p className="microsite-generating-kicker">Siap balapan?</p>
      <p className="microsite-generating-headline">
        Buktikan di clearly controlled circuit
      </p>
      <div className="microsite-generating-event-frame">
        <span className="microsite-generating-event-corner microsite-generating-event-corner-tl" aria-hidden />
        <span className="microsite-generating-event-corner microsite-generating-event-corner-tr" aria-hidden />
        <span className="microsite-generating-event-corner microsite-generating-event-corner-bl" aria-hidden />
        <span className="microsite-generating-event-corner microsite-generating-event-corner-br" aria-hidden />
        <p className="microsite-generating-event-copy">
          Senayan City | Jumat–Minggu, 6–8 November 2026
        </p>
      </div>
    </div>
  );
}
