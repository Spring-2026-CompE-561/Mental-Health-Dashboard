import { useNavigate } from 'react-router-dom';
import { logout as logoutApi } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();

  function handleLogout() {
    logoutApi().catch(() => {});
    localStorage.removeItem('access_token');
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-bg">
      <nav className="flex items-center justify-between px-8 py-5 bg-white/60 backdrop-blur-sm">
        <span className="text-lg font-semibold text-text-primary">Mental Health Dashboard</span>
        <button
          onClick={handleLogout}
          className="text-sm text-text-primary hover:text-text-secondary cursor-pointer bg-transparent border-none"
        >
          Logout
        </button>
      </nav>
      {/* Dashboard content will be implemented here */}
    </div>
  );
}
