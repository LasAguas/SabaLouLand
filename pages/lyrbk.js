// Landing page for the QR code printed in the lyric booklet. Placeholder for
// now — the real booklet gets built here later.
import Head from "next/head";

export default function Lyrbk() {
  return (
    <>
      <Head>
        <title>lyrbk — Sabalouland</title>
      </Head>
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px" }}>
        <p>nice! the QR code for the lyric booklet is working</p>
      </main>
    </>
  );
}
