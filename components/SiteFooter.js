// (7) the footer — socials, handle, contact, impressum, copyright.
//
// Lifted verbatim out of pages/index.js when /store needed the same block, so
// the two can't drift apart. The only thing that varies between the pages is
// the hairline above it: the home page draws it here, the store page has
// already drawn its own section rule, so it passes divider={false}.
import Link from "next/link";
import SocialIcon from "./SocialIcons";
import { CONTACT_EMAIL, SOCIALS } from "../lib/content";
import { useLanguage } from "../lib/useLanguage";

// how far each social icon kicks when you hover it
const SOCIAL_TILT = [-6, 3, -2, 5, -4];

export default function SiteFooter({ divider = true }) {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className={`foot-in foot${divider ? " ruled" : ""}`}>
      <div className="socials">
        <span className="lead">{t.footer.findMe}</span>
        <ul>
          {SOCIALS.map((s, i) => (
            <li key={s.key} style={{ "--tilt": `${SOCIAL_TILT[i % SOCIAL_TILT.length]}deg` }}>
              <a
                href={s.href}
                target="_blank"
                rel="me noopener noreferrer"
                className="tilt"
                title={s.key}
                data-track-type={s.track.type}
                data-track-label={s.key}
                data-track-platform={s.track.platform}
                data-track-category={s.track.type}
              >
                <SocialIcon name={s.key} />
                <span className="sr-only">{s.key}</span>
              </a>
            </li>
          ))}
        </ul>
        <span className="handle">@sabalouland</span>

        {/* the plus signs are part of the mark, not decoration */}
        <a
          className="contact"
          href={`mailto:${CONTACT_EMAIL}`}
          data-track-type="other"
          data-track-label="contact"
          data-track-category="contact"
        >
          <span aria-hidden="true">+</span>
          {t.contact}
          <span aria-hidden="true">+</span>
        </a>
      </div>

      <div className="fine">
        {/* TODO: /impressum doesn't exist yet — see TODO.md */}
        <Link
          href="/impressum"
          className="impressum"
          data-track-type="other"
          data-track-label="impressum"
          data-track-category="legal"
        >
          {t.footer.impressum}
        </Link>
        <span className="dot" aria-hidden="true">·</span>
        <span>© {year} Saba Lou</span>
        <span className="dot last" aria-hidden="true">·</span>
        <span className="rights">{t.footer.rights}</span>
      </div>

      <style jsx>{`
        .foot-in {
          width: min(1240px, 100%);
          margin: 0 auto;
        }
        .foot {
          display: flex;
          flex-direction: column;
          gap: 1.6rem;
          padding: 2.6rem 0 0;
        }
        .foot.ruled { border-top: var(--rule) solid var(--foot-ink-dim); }

        .socials {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          flex-wrap: wrap;
        }
        .lead, .handle {
          font-size: 0.84em;
          letter-spacing: 0.06em;
          color: var(--foot-ink-dim);
        }
        .handle { color: var(--foot-ink); }

        .socials ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .socials li:nth-child(even) { transform: translateY(-4px); }
        .socials li:nth-child(3) { transform: translateY(3px); }

        /* scoped to the icon list — the contact link lives in this row too and
           must not inherit the 2.3rem icon box */
        .socials ul :global(a) {
          display: grid;
          place-items: center;
          width: 2.3rem;
          height: 2.3rem;
          color: var(--foot-ink);
          transform-origin: center;
          transition: filter 200ms ease, transform 260ms cubic-bezier(0.34, 1.4, 0.64, 1);
        }
        .socials ul :global(a:hover) {
          filter: brightness(1.25);
          transform: rotate(var(--tilt)) scale(1.1);
        }

        .contact {
          display: inline-flex;
          align-items: baseline;
          gap: 0;
          flex: none;
          white-space: nowrap;
          margin-left: auto;
          color: var(--foot-ink);
          font-size: 1.02em;
          letter-spacing: 0.02em;
          transition: filter 180ms ease, transform 200ms ease;
        }
        .contact:hover { filter: brightness(1.25); transform: translateY(-1px); }

        .fine {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          font-size: 0.78em;
          color: var(--foot-ink-dim);
          letter-spacing: 0.03em;
        }
        .fine :global(.impressum) {
          color: var(--foot-ink);
          border-bottom: var(--rule) solid var(--foot-ink-dim);
          padding-bottom: 1px;
          transition: filter 180ms ease, border-color 180ms ease;
        }
        .fine :global(.impressum:hover) {
          filter: brightness(1.25);
          border-bottom-color: var(--foot-ink);
        }
        .dot { opacity: 0.5; }

        /* Narrow: the auto margin would otherwise strand "+contact+" against
           the right edge once the icon row has wrapped. */
        @media (max-width: 860px) {
          .contact { margin-left: 0; }
        }
        @media (max-width: 560px) {
          .rights, .dot.last { display: none; }
          .foot { padding: 2rem 0 0; }
        }
      `}</style>
    </footer>
  );
}
