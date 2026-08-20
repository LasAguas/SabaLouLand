// Unstyled for now — this exists so the earlier third-person bio is parked
// somewhere real rather than lost. We'll design this page together.
import Head from "next/head";
import Link from "next/link";
import { useLanguage } from "../lib/useLanguage";

export default function About() {
  const { t } = useLanguage();

  return (
    <>
      <Head>
        <title>{`${t.about.title} — Saba Lou Land`}</title>
      </Head>
      <main style={{ maxWidth: "42rem", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <h1>{t.about.title}</h1>
        {t.about.bio.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
        <p>
          <Link href="/">← saba lou land</Link>
        </p>
      </main>
    </>
  );
}
