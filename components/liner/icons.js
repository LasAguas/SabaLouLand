// Small inline icons for the liner-notes designs. Drawn as SVG so they don't
// depend on which glyphs the handwritten font happens to have, and so they take
// whatever colour the button around them sets (currentColor).
const base = {
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": "true",
  focusable: "false",
};

export const PlayIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M8 5.2v13.6a.6.6 0 0 0 .92.5l10.6-6.8a.6.6 0 0 0 0-1L8.92 4.7A.6.6 0 0 0 8 5.2Z" />
  </svg>
);

export const PauseIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="6.5" y="5" width="3.8" height="14" rx="1" />
    <rect x="13.7" y="5" width="3.8" height="14" rx="1" />
  </svg>
);

export const PrevIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="5" y="5" width="2.6" height="14" rx="1" />
    <path d="M19 6.1v11.8a.5.5 0 0 1-.78.42l-8.6-5.9a.5.5 0 0 1 0-.84l8.6-5.9A.5.5 0 0 1 19 6.1Z" />
  </svg>
);

export const NextIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="16.4" y="5" width="2.6" height="14" rx="1" />
    <path d="M5 6.1v11.8a.5.5 0 0 0 .78.42l8.6-5.9a.5.5 0 0 0 0-.84l-8.6-5.9A.5.5 0 0 0 5 6.1Z" />
  </svg>
);

const stroke = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
  focusable: "false",
};

export const CloseIcon = (p) => (
  <svg {...stroke} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const ChevronIcon = ({ dir = "down", ...p }) => (
  <svg {...stroke} {...p}>
    <path d={dir === "down" ? "M6 9l6 6 6-6" : "M6 15l6-6 6 6"} />
  </svg>
);

export const BurgerIcon = (p) => (
  <svg {...stroke} {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

/** Three bars that bounce while `playing` — marks the current track in a list. */
export function Bars({ playing }) {
  return (
    <span className={`bars${playing ? " on" : ""}`} aria-hidden="true">
      <i />
      <i />
      <i />
      <style jsx>{`
        .bars {
          display: inline-flex;
          align-items: flex-end;
          gap: 2px;
          width: 14px;
          height: 14px;
          flex: none;
        }
        i {
          flex: 1;
          height: 100%;
          background: currentColor;
          border-radius: 1px;
          transform: scaleY(0.35);
          transform-origin: bottom;
        }
        .on i {
          animation: bounce 900ms ease-in-out infinite;
        }
        .on i:nth-child(2) {
          animation-delay: -300ms;
        }
        .on i:nth-child(3) {
          animation-delay: -600ms;
        }
        @keyframes bounce {
          0%,
          100% {
            transform: scaleY(0.35);
          }
          50% {
            transform: scaleY(1);
          }
        }
      `}</style>
    </span>
  );
}
