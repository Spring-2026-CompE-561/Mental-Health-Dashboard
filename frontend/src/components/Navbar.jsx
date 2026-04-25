import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export default function Navbar({ rightLink }) {
  const { isDark, toggleTheme } = useTheme();

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
          <circle cx="22" cy="22" r="14" stroke={isDark ? '#cbd5e1' : '#555'} strokeWidth="2" />
          <circle cx="22" cy="6" r="3.5" fill={isDark ? '#cbd5e1' : '#555'} />
          <circle cx="36" cy="14" r="3.5" fill={isDark ? '#cbd5e1' : '#555'} />
          <circle cx="36" cy="30" r="3.5" fill={isDark ? '#cbd5e1' : '#555'} />
          <circle cx="22" cy="38" r="3.5" fill={isDark ? '#cbd5e1' : '#555'} />
          <circle cx="8" cy="30" r="3.5" fill={isDark ? '#cbd5e1' : '#555'} />
          <circle cx="8" cy="14" r="3.5" fill={isDark ? '#cbd5e1' : '#555'} />
          <path
            d="M22 10L22 18 M32 16L27 20 M32 28L27 24 M22 34L22 26 M12 28L17 24 M12 16L17 20"
            stroke={isDark ? '#cbd5e1' : '#555'}
            strokeWidth="2"
          />
          <circle cx="22" cy="22" r="4" fill={isDark ? '#cbd5e1' : '#555'} />
        </svg>
        <span
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--body-color)',
            letterSpacing: '-0.02em',
          }}
        >
          Mental Health
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {rightLink && (
          <Link
            to={rightLink.to}
            style={{
              fontSize: '16px',
              fontWeight: '500',
              color: 'var(--secondary-color)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--heading-color)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--secondary-color)')}
          >
            {rightLink.label}
          </Link>
        )}

        {/* Dark mode toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: isDark ? '#334155' : '#f3f4f6',
            color: isDark ? '#f9f0b2' : '#555',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? '#475569' : '#e5e7eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f3f4f6';
          }}
        >
          {isDark ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}
