import { useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [searchParams] = useSearchParams();
  const ranRef = useRef(false);
  const token = searchParams.get('token');
  const errorParam = searchParams.get('error');

  useEffect(() => {
    // StrictMode runs effects twice in dev — guard so we only signIn once.
    if (ranRef.current) return;
    ranRef.current = true;

    if (token) {
      signIn(token);
      navigate('/dashboard', { replace: true });
    }
  }, [token, signIn, navigate]);

  if (errorParam || !token) {
    return (
      <div className="min-h-screen bg-[#Fafbfb] flex items-center justify-center p-[40px]">
        <div className="w-full max-w-[480px] bg-white border border-gray-100 rounded-[32px] p-[48px] shadow-sm text-center">
          <h1 className="font-semibold text-[28px] text-[#222] mb-4">Sign-in failed</h1>
          <p className="text-[#555] mb-6">
            {errorParam || "We couldn't complete your Google sign-in. Please try again."}
          </p>
          <Link
            to="/login"
            className="inline-block bg-[#b2def9] text-white font-semibold px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#Fafbfb] flex items-center justify-center">
      <p className="text-[#555] text-[18px]">Signing you in…</p>
    </div>
  );
}
