import { Html, Head, Main, NextScript } from "next/document";
import { THEME_BOOT_SCRIPT } from "../lib/useTheme";

export default function Document() {
  return (
    <Html lang="en" data-theme="dark">
      <Head>
        <link rel="icon" href="/images/icons/logo.png" type="image/png" />
        <meta name="theme-color" content="#07090c" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#efe7d8" media="(prefers-color-scheme: light)" />
      </Head>
      <body>
        {/* paint the stored theme before first paint, so there's no flash */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
