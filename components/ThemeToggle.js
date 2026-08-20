// (3) top-right — light / dark switch.
// Two options side by side rather than one toggling label, so which mode you're
// in is visible without reading: the active option is ringed and full-strength.
// TODO: swap the sun/moon glyphs for Saba Lou's own light + dark logos.
import { useLanguage } from "../lib/useLanguage";
import { useTheme } from "../lib/useTheme";

function Glyph({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none"
         stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      {name === "dark" ? (
        <path d="M20 14.5A8.2 8.2 0 0 1 9.6 4.2 8.5 8.5 0 1 0 20 14.5Z" strokeLinejoin="round" />
      ) : (
        <>
          <circle cx="12" cy="12" r="4.1" />
          <path d="M12 2.8v2.1M12 19.1v2.1M2.8 12h2.1M19.1 12h2.1M5.5 5.5l1.5 1.5M17 17l1.5 1.5M18.5 5.5 17 7M7 17l-1.5 1.5"
                strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  const options = [
    { key: "light", label: t.themeLabel.toLight },
    { key: "dark", label: t.themeLabel.toDark },
  ];

  return (
    <div className="panel modes" style={{ "--tilt": "1.6deg" }} role="group" aria-label={t.themeGroup}>
      {options.map((o) => {
        const on = theme === o.key;
        return (
          <button
            key={o.key}
            type="button"
            className={`chip${on ? " selected" : " muted"}`}
            aria-pressed={on}
            title={o.label}
            onClick={() => setTheme(o.key)}
          >
            <Glyph name={o.key} />
            <span className="sr-only">{o.label}</span>
          </button>
        );
      })}

      <style jsx>{`
        /* icons only, and a vertical stack at every width */
        .modes { width: 3.1rem; }
        .modes :global(.chip) { justify-content: center; padding-inline: 0.4rem; }
        .modes :global(.chip):nth-child(2) { transform: rotate(-0.9deg); }
      `}</style>
    </div>
  );
}
