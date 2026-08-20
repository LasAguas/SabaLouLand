// (10) placeholder moon.
//
// It already takes a `phase` (0 = new, 0.25 = first quarter, 0.5 = full,
// 0.75 = last quarter) and draws the terminator for it, so wiring it to the
// real lunar cycle later is a matter of feeding this prop from a moon-phase
// calculation instead of the fixed value in pages/index.js.
export default function Moon({ phase = 0.62, size = 54, className = "" }) {
  const p = ((phase % 1) + 1) % 1;
  const r = 20;

  // Terminator = the projection of the day/night circle. Its half-width goes
  // 1 -> 0 -> 1 across each half of the cycle; the sign says which limb is lit.
  const k = Math.cos(2 * Math.PI * p); // +1 at new, -1 at full
  const rx = Math.abs(k) * r;
  // Waxing (p<0.5) lights the right limb, waning the left.
  const sweepOuter = p < 0.5 ? 1 : 0;
  // Gibbous (k<0) bulges the terminator into the dark side; a crescent (k>0)
  // bulges it back across the lit side.
  const sweepInner = k < 0 ? (p < 0.5 ? 1 : 0) : (p < 0.5 ? 0 : 1);

  const lit = `M 24 4 A ${r} ${r} 0 0 ${sweepOuter} 24 44 A ${rx} ${r} 0 0 ${sweepInner} 24 4 Z`;

  return (
    <span className={`moon ${className}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" width={size} height={size}>
        {/* the disc, always faintly there */}
        <circle cx="24" cy="24" r={r} className="disc" />
        {p > 0.01 && p < 0.99 && <path d={lit} className="lit" />}
        <circle cx="24" cy="24" r={r} className="rim" />
      </svg>

      <style jsx>{`
        .moon { display: inline-block; line-height: 0; }
        .disc { fill: var(--ink); opacity: 0.08; }
        .lit { fill: var(--ink); opacity: 0.82; }
        .rim {
          fill: none;
          stroke: var(--ink-faint);
          stroke-width: 1.2;
          stroke-dasharray: 3.5 2.5;
        }
      `}</style>
    </span>
  );
}
