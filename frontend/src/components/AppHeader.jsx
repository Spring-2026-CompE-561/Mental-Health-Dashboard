import { Link, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Shared header used across pages. The right side can be:
 *   - links: array of { label, to } pairs
 *   - logout: true to show a Logout action (takes priority over links when authenticated)
 */
export default function AppHeader({ title = 'Mental Health Dashboard', links = [], logout = false }) {
  const { isAuthenticated, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  const showLogout = logout && isAuthenticated;

  return (
    <header
      className="flex w-full items-center justify-between px-6 py-6 md:px-[80px] md:py-[32px] shrink-0"
      style={{
        borderBottom: '1px solid var(--border-light)',
        backgroundColor: 'var(--card-bg)',
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-3 md:gap-4 no-underline">
        <Logo size={36} stroke={isDark ? '#cbd5e1' : '#555'} />
        <span
          className="font-semibold text-[18px] md:text-[22px] tracking-tight"
          style={{ color: 'var(--body-color)' }}
        >
          {title}
        </span>
      </Link>

      <nav className="flex items-center gap-4 md:gap-[36px]">
        {!showLogout &&
          links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="font-medium text-[16px] md:text-[18px] transition-colors no-underline"
              style={{ color: 'var(--secondary-color)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--heading-color)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--secondary-color)')}
            >
              {link.label}
            </Link>
          ))}
        {showLogout && (
          <button
            type="button"
            onClick={handleLogout}
            className="font-medium text-[16px] md:text-[18px] transition-colors bg-transparent border-none cursor-pointer p-0"
            style={{ color: 'var(--secondary-color)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--heading-color)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--secondary-color)')}
          >
            Logout
          </button>
        )}

        {/* Dark mode toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex items-center justify-center w-[38px] h-[38px] rounded-full transition-colors cursor-pointer border-none"
          style={{
            backgroundColor: isDark ? '#334155' : '#f3f4f6',
            color: isDark ? '#f9f0b2' : '#555',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? '#475569' : '#e5e7eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f3f4f6';
          }}
        >
          {isDark ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </nav>
    </header>
  );
}
