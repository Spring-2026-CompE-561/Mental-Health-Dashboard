import { Link, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';

/**
 * Shared header used across pages. The right side can be:
 *   - links: array of { label, to } pairs
 *   - logout: true to show a Logout action (takes priority over links when authenticated)
 */
export default function AppHeader({ title = 'Mental Health Dashboard', links = [], logout = false }) {
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  const showLogout = logout && isAuthenticated;

  return (
    <header className="flex w-full items-center justify-between px-6 py-6 md:px-[80px] md:py-[32px] shrink-0 border-b border-gray-100 bg-white">
      <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-3 md:gap-4 no-underline">
        <Logo size={36} />
        <span className="font-semibold text-[18px] md:text-[22px] text-[#333] tracking-tight">
          {title}
        </span>
      </Link>

      <nav className="flex items-center gap-6 md:gap-[48px]">
        {!showLogout &&
          links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="font-medium text-[16px] md:text-[18px] text-[#555] hover:text-[#111] transition-colors no-underline"
            >
              {link.label}
            </Link>
          ))}
        {showLogout && (
          <button
            type="button"
            onClick={handleLogout}
            className="font-medium text-[16px] md:text-[18px] text-[#555] hover:text-[#111] transition-colors bg-transparent border-none cursor-pointer p-0"
          >
            Logout
          </button>
        )}
      </nav>
    </header>
  );
}
