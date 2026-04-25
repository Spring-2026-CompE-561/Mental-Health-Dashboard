import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader';

export default function Landing() {
  return (
    <div
      className="flex flex-col relative w-full min-h-screen"
      style={{ backgroundColor: 'var(--page-bg)', transition: 'background-color 0.3s' }}
    >
      <AppHeader
        links={[
          { label: 'Register', to: '/create-account' },
          { label: 'Login', to: '/login' },
        ]}
      />

      <main className="flex-1 flex flex-col items-center justify-center text-center px-[40px] pb-[80px] md:pb-[160px]">
        <h1
          className="font-semibold text-[40px] md:text-[56px] tracking-tight mb-[24px] max-w-[900px]"
          style={{ color: 'var(--heading-color)' }}
        >
          Track Your Mental Health Journey
        </h1>
        <p
          className="font-normal text-[18px] md:text-[24px] mb-[40px]"
          style={{ color: 'var(--secondary-color)' }}
        >
          A guided, compassionate tool for holistic well-being.
        </p>
        <p
          className="font-medium text-[20px] md:text-[28px] mb-[56px]"
          style={{ color: 'var(--heading-color)' }}
        >
          Log your mood, write journals, track your progress.
        </p>

        {/* Decorative dots chart */}
        <div className="mb-[64px] relative w-[300px] h-[50px] flex justify-center items-center">
          <svg width="280" height="50" viewBox="0 0 280 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 30 L80 15 L140 35 L200 20 L260 25" stroke="var(--border-color)" strokeWidth="3" />
            <circle cx="20" cy="30" r="10" fill="#f9b2d7" />
            <circle cx="80" cy="15" r="10" fill="#b2def9" />
            <circle cx="140" cy="35" r="10" fill="#b2f9c8" />
            <circle cx="200" cy="20" r="10" fill="#f9f0b2" />
            <circle cx="260" cy="25" r="10" fill="#f9b2d7" />
          </svg>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-[16px] sm:gap-[32px]">
          <Link
            to="/login"
            className="bg-[#f9b2d7] rounded-[16px] shadow-[0px_8px_24px_rgba(249,178,215,0.4)] flex items-center justify-center w-[220px] h-[68px] cursor-pointer hover:opacity-90 transition-opacity"
          >
            <span className="font-semibold text-[24px] text-white tracking-wide">Login</span>
          </Link>
          <Link
            to="/create-account"
            className="bg-[#b2def9] rounded-[16px] shadow-[0px_8px_24px_rgba(178,222,249,0.4)] flex items-center justify-center w-[220px] h-[68px] cursor-pointer hover:opacity-90 transition-opacity"
          >
            <span className="font-semibold text-[24px] text-white tracking-wide">Get Started</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
