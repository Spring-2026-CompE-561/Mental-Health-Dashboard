import { useState } from 'react';
import { getGoogleAuthUrl } from '../services/api';

export default function GoogleButton({ label = 'Continue with Google' }) {
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);
    try {
      const data = await getGoogleAuthUrl();
      window.location.href = data.url;
    } catch (err) {
      console.error('Google auth error:', err);
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      className="w-full h-[56px] md:h-[60px] border border-gray-200 rounded-2xl bg-white hover:bg-gray-50 hover:border-[#b2def9] flex items-center justify-center gap-3 md:gap-4 shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4" />
        <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.72 18.23 13.47 18.63 12 18.63C9.15 18.63 6.74 16.71 5.86 14.14H2.18V16.99C3.99 20.59 7.69 23 12 23Z" fill="#34A853" />
        <path d="M5.86 14.14C5.64 13.47 5.51 12.75 5.51 12C5.51 11.25 5.63 10.53 5.86 9.86V7.01H2.18C1.43 8.5 1 10.19 1 12C1 13.81 1.43 15.5 2.18 16.99L5.86 14.14Z" fill="#FBBC05" />
        <path d="M12 5.38C13.62 5.38 15.06 5.93 16.2 7.02L19.36 3.86C17.45 2.08 14.97 1 12 1C7.69 1 3.99 3.41 2.18 7.01L5.86 9.86C6.74 7.29 9.15 5.38 12 5.38Z" fill="#EA4335" />
      </svg>
      <span className="font-semibold text-[16px] md:text-[18px] text-[#444] tracking-tight">
        {loading ? 'Redirecting…' : label}
      </span>
    </button>
  );
}
