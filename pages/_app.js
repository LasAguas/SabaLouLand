import { useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import localFont from "next/font/local";
import { Patrick_Hand } from "next/font/google";
import ConsentBanner from "../components/ConsentBanner";
import { startTracker, trackPageview } from "../lib/tracker";
import { LanguageProvider } from "../lib/useLanguage";
import { ThemeProvider } from "../lib/useTheme";
import "../styles/globals.css";

// (2) the title face.
const springfield = localFont({
  src: "../fonts/SpringfieldLTStd.ttf",
  variable: "--font-springfield",
  display: "swap",
});

// Everything else. HEADS UP: this face currently has only 98 glyphs — no
// "d"/"D", no "4", no hyphen, apostrophe, parentheses or Spanish accents.
// Missing characters fall through to --font-hand-fallback below, glyph by
// glyph, which is visible. See TODO.md, item 5.
const sabalou = localFont({
  src: "../fonts/SabaLouHandwritten2.otf",
  variable: "--font-sabalou",
  display: "swap",
  // next/font would otherwise slot a metric-adjusted Arial in right behind this
  // face, which would swallow every missing glyph before the handwritten
  // fallback below ever got a look in.
  adjustFontFallback: false,
});

// Stand-in for the glyphs the handwritten face doesn't have yet. Swap this for
// a closer match (or delete it once the real face is complete).
const fallbackHand = Patrick_Hand({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-hand-fallback",
  display: "swap",
});

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // Start once, then a pageview per client-side route change. Next navigates
  // without a reload, so without the second half the whole visit would be
  // recorded as a single pageview of the entry page.
  useEffect(() => {
    startTracker(window.location.pathname);
    const onRoute = (url) => trackPageview(url.split("?")[0]);
    router.events.on("routeChangeComplete", onRoute);
    return () => router.events.off("routeChangeComplete", onRoute);
  }, [router.events]);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <div className={`site-root ${springfield.variable} ${sabalou.variable} ${fallbackHand.variable}`}>
          <Component {...pageProps} />
          <ConsentBanner />
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
}
