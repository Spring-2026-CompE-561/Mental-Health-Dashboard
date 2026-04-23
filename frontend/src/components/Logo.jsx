export default function Logo({ size = 44, stroke = '#555' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="22" cy="22" r="14" stroke={stroke} strokeWidth="2" />
      <circle cx="22" cy="6" r="4" fill={stroke} />
      <circle cx="36" cy="14" r="4" fill={stroke} />
      <circle cx="36" cy="30" r="4" fill={stroke} />
      <circle cx="22" cy="38" r="4" fill={stroke} />
      <circle cx="8" cy="30" r="4" fill={stroke} />
      <circle cx="8" cy="14" r="4" fill={stroke} />
      <path
        d="M22 10L22 18 M32 16L27 20 M32 28L27 24 M22 34L22 26 M12 28L17 24 M12 16L17 20"
        stroke={stroke}
        strokeWidth="2"
      />
      <circle cx="22" cy="22" r="4" fill={stroke} />
    </svg>
  );
}
