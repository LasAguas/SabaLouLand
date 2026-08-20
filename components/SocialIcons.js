// Inline glyphs so there's no icon dependency and they inherit currentColor.
const PATHS = {
  instagram: (
    <>
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.2" cy="6.8" r="1.05" fill="currentColor" stroke="none" />
    </>
  ),
  spotify: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M7.4 9.3c3.1-.85 6.6-.5 9.2 1M8 12.4c2.6-.7 5.4-.4 7.6.85M8.6 15.4c2-.5 4.2-.3 5.9.7" strokeLinecap="round" />
    </>
  ),
  youtube: (
    <>
      <rect x="2.6" y="5.2" width="18.8" height="13.6" rx="4.2" />
      <path d="M10.3 9.1v5.8l5-2.9z" strokeLinejoin="round" />
    </>
  ),
  bandcamp: <path d="M3.4 17.6 9.1 6.4h11.5l-5.7 11.2z" strokeLinejoin="round" />,
  tiktok: (
    <>
      <path d="M14.1 3.2v10.9a3.9 3.9 0 1 1-3.2-3.83" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.1 6.2a4.7 4.7 0 0 0 4.4 3.2" strokeLinecap="round" />
    </>
  ),
};

export default function SocialIcon({ name, size = 21 }) {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.35" aria-hidden="true">
      {path}
    </svg>
  );
}

export { PATHS };
