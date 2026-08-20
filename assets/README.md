Source masters, not served to the browser.

- `hero-original.jpg` — the original square painting (2800×2800, ~5 MB).
  `public/images/hero.jpg` is a 2000×2000 / q80 derivative. Superseded by the
  hero below as the live hero image, kept in case the square crop is needed
  again.
- `hero-new-original.jpg` — the current hero painting, portrait with the fade
  to black painted in (2160×3840, ~3.8 MB). `public/images/hero-new.jpg` is a
  1440×2560 / q82 derivative of it.
- `moons-original/` — the eight lunar-phase textures at their original
  2080×2080 (~1.5–6.6 MB each). `public/images/moons/` holds 1400×1400
  derivatives (no optimizer beyond `sips -Z` was available when these were
  made — pngquant/optipng would shrink them further if installed later).

Re-crop or re-export from these files rather than from the served copies.
