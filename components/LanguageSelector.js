// (1) top-left — vertical language selector.
import { useLanguage } from "../lib/useLanguage";

export default function LanguageSelector() {
  const { lang, setLang, languages, t } = useLanguage();

  return (
    <nav className="panel langs" style={{ "--tilt": "-1.4deg" }} aria-label={t.languageLabel}>
      {languages.map((l) => (
        <button
          key={l.code}
          type="button"
          className={`chip${l.code === lang ? "" : " muted"}`}
          aria-current={l.code === lang ? "true" : undefined}
          onClick={() => setLang(l.code)}
        >
          <span className="code">{l.short}</span>
          <span className="sr-only">{l.label}</span>
          {l.code === lang && <span className="mark" aria-hidden="true" />}
        </button>
      ))}

      <style jsx>{`
        .langs { width: 4.2rem; flex: none; }
        .code { text-transform: uppercase; letter-spacing: 0.06em; }
        /* the chips are rectangles, but the stack still leans a little */
        .langs :global(.chip):nth-child(2) { transform: rotate(0.8deg); }
        .langs :global(.chip):nth-child(3) { transform: rotate(-0.6deg); }

        /* stays a vertical stack at every width */

        /* Pinned to a fixed px width on phones rather than the desktop rem
           value: rem is root-font-relative, and a phone's own "larger text"
           accessibility setting scales the root font size — which would have
           scaled this panel's width right along with it, making the selector
           visibly wider ("longer") on exactly the devices most likely to have
           that setting on. flex: none stops it from being stretched by the
           mobile top bar's grid track as a belt-and-suspenders measure. */
        @media (max-width: 600px) {
          .langs { width: 52px; }
        }
      `}</style>
    </nav>
  );
}
