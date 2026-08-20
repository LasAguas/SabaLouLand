// (5) vertical nav rail. Pages are still being built — see TODO.md.
import Link from "next/link";
import { NAV } from "../lib/content";
import { useLanguage } from "../lib/useLanguage";

const LEAN = ["0deg", "0.9deg", "-0.7deg", "1.1deg"];

export default function NavRail() {
  const { t } = useLanguage();

  return (
    <nav className="panel rail" style={{ "--tilt": "1.2deg" }} aria-label={t.nav.label}>
      {NAV.map((item, i) => (
        <Link
          key={item.href}
          href={item.href}
          className="chip"
          style={{ transform: `rotate(${LEAN[i]})` }}
          data-track-type={item.key === "store" ? "merch" : "other"}
          data-track-label={item.key}
          data-track-category={item.key === "store" ? "merch" : "nav"}
        >
          {t.nav[item.key]}
        </Link>
      ))}

      <style jsx>{`
        .rail { width: 9.5rem; }

        /* under the title on a phone, so it reads as one row rather than a
           column pushing everything else down */
        @media (max-width: 860px) {
          .rail {
            width: auto;
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: center;
          }
          .rail :global(.chip) { width: auto; }
        }
      `}</style>
    </nav>
  );
}
