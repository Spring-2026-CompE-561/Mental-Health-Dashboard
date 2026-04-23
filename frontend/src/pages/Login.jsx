import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import GoogleButton from '../components/GoogleButton';
import { login as loginApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginApi({ email, password });
      signIn(data.access_token);
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col relative w-full min-h-screen bg-[#Fafbfb]">
      <AppHeader links={[{ label: 'Create Account', to: '/create-account' }]} />

      <main className="flex-1 w-full flex items-center justify-center p-[24px] md:p-[40px]">
        <div className="w-full max-w-[520px] bg-white border border-gray-100 rounded-[32px] md:rounded-[40px] p-[32px] md:p-[56px] shadow-sm flex flex-col gap-[28px] md:gap-[40px] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[8px] flex">
            <div className="flex-1 bg-[#f9b2d7]" />
            <div className="flex-1 bg-[#b2def9]" />
            <div className="flex-1 bg-[#b2f9c8]" />
            <div className="flex-1 bg-[#f9f0b2]" />
          </div>

          <h1 className="font-bold text-[36px] md:text-[48px] text-[#222] tracking-tight m-0 text-center">
            Login
          </h1>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-[24px] md:gap-[28px]">
            <div className="flex flex-col gap-[10px]">
              <label htmlFor="email" className="font-semibold text-[16px] text-[#555] ml-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full h-[60px] border border-gray-200 rounded-[20px] bg-[#fdfdfd] px-[20px] text-[16px] text-[#333] placeholder:text-[#aaa] focus:border-[#b2def9] focus:ring-4 focus:ring-[#b2def9]/10 focus:outline-none focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-col gap-[10px]">
              <div className="flex justify-between items-center ml-1">
                <label htmlFor="password" className="font-semibold text-[16px] text-[#555]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[14px] font-medium text-[#b2def9] hover:text-[#f9b2d7]"
                >
                  Forgot?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-[60px] border border-gray-200 rounded-[20px] bg-[#fdfdfd] px-[20px] text-[16px] text-[#333] placeholder:text-[#aaa] focus:border-[#b2def9] focus:ring-4 focus:ring-[#b2def9]/10 focus:outline-none focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#f9b2d7] rounded-[20px] shadow-[0px_10px_25px_rgba(249,178,215,0.4)] flex items-center justify-center w-full h-[64px] mt-[4px] hover:-translate-y-0.5 hover:shadow-[0px_12px_30px_rgba(249,178,215,0.5)] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none cursor-pointer border-none"
            >
              <span className="font-bold text-[20px] text-white tracking-wide">
                {loading ? 'Signing in…' : 'Sign In'}
              </span>
            </button>
          </form>

          <div className="flex items-center gap-[20px] w-full px-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="font-bold text-[14px] text-[#ccc] tracking-widest uppercase">OR</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <GoogleButton label="Continue with Google" />

          <p className="text-center font-medium text-[16px] text-[#666] m-0">
            Don&apos;t have an account yet?{' '}
            <Link
              to="/create-account"
              className="font-bold text-[#b2def9] hover:text-[#f9b2d7] transition-colors"
            >
              Create Account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
