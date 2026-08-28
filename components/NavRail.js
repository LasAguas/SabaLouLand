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
