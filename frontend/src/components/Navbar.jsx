import { Link } from 'react-router-dom';

export default function Navbar({ rightLink }) {
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 40px',
        backgroundColor: 'transparent',
      }}
    >
      <Link
        to="/login"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textDecoration: 'none',
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="22" cy="22" r="14" stroke="#555" strokeWidth="2" />
          <circle cx="22" cy="6" r="3.5" fill="#555" />
          <circle cx="36" cy="14" r="3.5" fill="#555" />
          <circle cx="36" cy="30" r="3.5" fill="#555" />
          <circle cx="22" cy="38" r="3.5" fill="#555" />
          <circle cx="8" cy="30" r="3.5" fill="#555" />
          <circle cx="8" cy="14" r="3.5" fill="#555" />
          <path
            d="M22 10L22 18 M32 16L27 20 M32 28L27 24 M22 34L22 26 M12 28L17 24 M12 16L17 20"
            stroke="#555"
            strokeWidth="2"
          />
          <circle cx="22" cy="22" r="4" fill="#555" />
        </svg>
        <span
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#333333',
            letterSpacing: '-0.02em',
          }}
        >
          Mental Health
        </span>
      </Link>
      {rightLink && (
        <Link
          to={rightLink.to}
          style={{
            fontSize: '16px',
            fontWeight: '500',
            color: '#555555',
            textDecoration: 'none',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.target.style.color = '#111111')}
          onMouseLeave={(e) => (e.target.style.color = '#555555')}
        >
          {rightLink.label}
        </Link>
      )}
    </nav>
  );
}
