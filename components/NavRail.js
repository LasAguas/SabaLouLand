// (5) vertical nav rail. Pages are still being built — see TODO.md.
import { useRouter } from "next/router";
import Link from "next/link";
import { NAV } from "../lib/content";
import { useLanguage } from "../lib/useLanguage";

export default function NavRail() {
  const { t } = useLanguage();
  const { pathname } = useRouter();
  // no reason to link home from the page you're already on
  const items = pathname === "/" ? NAV : [{ href: "/", key: "home" }, ...NAV];

  return (
    <nav className="panel rail" aria-label={t.nav.label}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="chip"
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
           column pushing everything else down. Never wraps to a second row —
           instead the chips shrink together as the viewport narrows, via the
           fluid font-size/padding below, so the row always holds one line. */
        @media (max-width: 860px) {
          .rail {
            width: auto;
            flex-direction: row;
            flex-wrap: nowrap;
            justify-content: center;
            gap: clamp(0.2rem, 1.6vw, 0.35rem);
          }
          .rail :global(.chip) {
            width: auto;
            white-space: nowrap;
            font-size: clamp(0.62em, 3.6vw, 0.92em);
            padding: clamp(0.16rem, 1vw, 0.28rem) clamp(0.3rem, 2.2vw, 0.7rem);
          }
        }
      `}</style>
    </nav>
  );
}
