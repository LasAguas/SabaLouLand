// Consent gate for the tracking that needs it (returning-visitor cookie, scroll
// depth, time-on-page). Pageviews, clicks, referrer, UTM, device and country run
// on legitimate interest and are recorded either way — declining is a real
// choice, not a no-op: it stops the persistent cookie and the engagement
// beacons.
//
// Same cookie names and semantics as the command's stock banner
// (`sl_consent` / `sl_ret`); only the presentation is the site's own, since the
// stock one is inline-styled sans-serif and would land on this page like a
// ransom note.
import { useEffect, useState } from "react";
import Link from "next/link";
import { declineConsent, getConsent, grantConsent } from "../lib/tracker";
import { useLanguage } from "../lib/useLanguage";

export default function ConsentBanner() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  // Only after mount — the cookie isn't readable during SSR, and rendering the
  // banner on the server would flash it at people who already answered.
  useEffect(() => {
    if (getConsent() === null) setShow(true);
  }, []);

  if (!show) return null;
  const c = t.consentBanner;

  return (
    <div className="bar" role="region" aria-label={c.label}>
      <p>
        {c.body}{" "}
        <Link href="/impressum">{c.more}</Link>
      </p>
      <div className="acts">
        <button
          type="button"
          className="ghost"
          onClick={() => {
            declineConsent();
            setShow(false);
          }}
        >
          {c.decline}
        </button>
        <button
          type="button"
          onClick={() => {
            grantConsent();
            setShow(false);
          }}
        >
          {c.accept}
        </button>
      </div>

      <style jsx>{`
        .bar {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.9rem;
          padding: 0.85rem clamp(1.1rem, 4vw, 3.2rem);
          background: var(--panel-bg);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-top: var(--rule) solid var(--chip-line);
          color: var(--chip-ink);
        }
        p {
          margin: 0;
          font-size: 0.84em;
          line-height: 1.45;
          max-width: 62ch;
        }
        .bar :global(a) {
          border-bottom: 1px solid currentColor;
          padding-bottom: 1px;
        }
        .acts { display: flex; gap: 0.5rem; flex: none; }
        button {
          cursor: pointer;
          font-size: 0.86em;
          padding: 0.32rem 0.9rem;
          background: var(--chip);
          color: var(--chip-ink);
          border: var(--rule) solid var(--chip-line);
          transition: filter 180ms ease, transform 180ms ease;
        }
        button:hover { filter: brightness(1.08); transform: translateY(-1px); }
        button.ghost { background: transparent; }

        @media (max-width: 560px) {
          .bar { justify-content: stretch; }
          .acts { width: 100%; }
          .acts button { flex: 1; }
        }
      `}</style>
    </div>
  );
}
