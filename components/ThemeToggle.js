// (3) top-right — light / dark switch.
// Two options side by side rather than one toggling label, so which mode you're
// in is visible without reading: the active option is ringed and full-strength.
import { useLanguage } from "../lib/useLanguage";
import { useTheme } from "../lib/useTheme";

const GLYPH = {
  light: "/images/icons/mode-light.png",
  dark: "/images/icons/mode-dark.png",
};

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  const options = [
    { key: "light", label: t.themeLabel.toLight },
    { key: "dark", label: t.themeLabel.toDark },
  ];

  return (
    <div className="panel modes" role="group" aria-label={t.themeGroup}>
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
            <img className="glyph" src={GLYPH[o.key]} alt="" />
            <span className="sr-only">{o.label}</span>
          </button>
        );
      })}

      <style jsx>{`
        /* icons only, and a vertical stack at every width */
        .modes { width: 3.1rem; }
        .modes :global(.chip) { justify-content: center; padding-inline: 0.4rem; }
        .glyph { display: block; width: 17px; height: 17px; object-fit: contain; }
      `}</style>
    </div>
  );
}
