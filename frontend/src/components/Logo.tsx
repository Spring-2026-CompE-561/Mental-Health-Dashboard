"use client";

/**
 * Mental Health Dashboard logo.
 *
 * Symbolism:
 *  - Outer halo ring  → groundedness, presence
 *  - Lotus petals     → growth out of difficulty (a calming, universal motif)
 *  - Breath wave      → the steady inhale/exhale that anchors the practice
 *  - Centre dot       → the still point you return to
 *
 * The whole mark is built from soft pastel strokes that match the existing
 * palette stripes (`#f9b2d7`, `#b2def9`, `#b2f9c8`, `#f9f0b2`) so it harmonises
 * with the journal cards and gradient strip already used across the app.
 */

interface LogoProps {
  size?: number;
  /** Primary stroke colour. Kept for backwards-compat with existing call sites. */
  stroke?: string;
}

export default function Logo({ size = 44, stroke = "#555" }: LogoProps) {
  // Petal palette — same pastels used elsewhere, dark-mode-safe.
  const petalA = "#f9b2d7"; // pink
  const petalB = "#b2def9"; // blue
  const petalC = "#b2f9c8"; // green
  const petalD = "#f9f0b2"; // yellow

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Mental Health Dashboard logo — a lotus and breath wave inside a halo"
    >
      {/* Outer halo */}
      <circle
        cx="22"
        cy="22"
        r="19"
        stroke={stroke}
        strokeOpacity="0.35"
        strokeWidth="1.2"
      />
      <circle
        cx="22"
        cy="22"
        r="16"
        stroke={stroke}
        strokeOpacity="0.18"
        strokeWidth="0.8"
      />

      {/* Lotus — four overlapping petals with soft pastel fills */}
      <path
        d="M22 8 C 16 14, 16 20, 22 24 C 28 20, 28 14, 22 8 Z"
        fill={petalB}
        fillOpacity="0.55"
        stroke={stroke}
        strokeOpacity="0.55"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M10 18 C 14 14, 20 16, 22 22 C 18 24, 12 24, 10 18 Z"
        fill={petalA}
        fillOpacity="0.55"
        stroke={stroke}
        strokeOpacity="0.55"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M34 18 C 30 14, 24 16, 22 22 C 26 24, 32 24, 34 18 Z"
        fill={petalC}
        fillOpacity="0.55"
        stroke={stroke}
        strokeOpacity="0.55"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M14 24 C 17 22, 27 22, 30 24 C 27 30, 17 30, 14 24 Z"
        fill={petalD}
        fillOpacity="0.7"
        stroke={stroke}
        strokeOpacity="0.55"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Breath wave — a soft sine across the lower third */}
      <path
        d="M7 33 Q 12 30, 17 33 T 27 33 T 37 33"
        stroke={stroke}
        strokeOpacity="0.85"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Centre dot — the still point */}
      <circle cx="22" cy="22" r="1.6" fill={stroke} />
    </svg>
  );
}
