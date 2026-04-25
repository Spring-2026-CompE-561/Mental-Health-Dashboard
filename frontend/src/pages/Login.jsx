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
    <div
      className="flex flex-col relative w-full min-h-screen"
      style={{ backgroundColor: 'var(--page-bg)', transition: 'background-color 0.3s' }}
    >
      <AppHeader links={[{ label: 'Create Account', to: '/create-account' }]} />

      <main className="flex-1 w-full flex items-center justify-center p-[24px] md:p-[40px]">
        <div
          className="w-full max-w-[520px] rounded-[32px] md:rounded-[40px] p-[32px] md:p-[56px] shadow-sm flex flex-col gap-[28px] md:gap-[40px] relative overflow-hidden"
          style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-light)',
            transition: 'background-color 0.3s, border-color 0.3s',
          }}
        >
          <div className="absolute top-0 left-0 w-full h-[8px] flex">
            <div className="flex-1 bg-[#f9b2d7]" />
            <div className="flex-1 bg-[#b2def9]" />
            <div className="flex-1 bg-[#b2f9c8]" />
            <div className="flex-1 bg-[#f9f0b2]" />
          </div>

          <h1
            className="font-bold text-[36px] md:text-[48px] tracking-tight m-0 text-center"
            style={{ color: 'var(--heading-color)' }}
          >
            Login
          </h1>

          {error && (
            <div
              className="px-4 py-3 rounded-xl text-sm text-center"
              style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-color)' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-[24px] md:gap-[28px]">
            <div className="flex flex-col gap-[10px]">
              <label
                htmlFor="email"
                className="font-semibold text-[16px] ml-1"
                style={{ color: 'var(--secondary-color)' }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full h-[60px] rounded-[20px] px-[20px] text-[16px] focus:ring-4 focus:ring-[#b2def9]/10 focus:outline-none transition-all"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--body-color)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#b2def9';
                  e.target.style.backgroundColor = 'var(--input-focus-bg)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-color)';
                  e.target.style.backgroundColor = 'var(--input-bg)';
                }}
              />
            </div>

            <div className="flex flex-col gap-[10px]">
              <div className="flex justify-between items-center ml-1">
                <label
                  htmlFor="password"
                  className="font-semibold text-[16px]"
                  style={{ color: 'var(--secondary-color)' }}
                >
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
                className="w-full h-[60px] rounded-[20px] px-[20px] text-[16px] focus:ring-4 focus:ring-[#b2def9]/10 focus:outline-none transition-all"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--body-color)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#b2def9';
                  e.target.style.backgroundColor = 'var(--input-focus-bg)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-color)';
                  e.target.style.backgroundColor = 'var(--input-bg)';
                }}
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
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-light)' }} />
            <span
              className="font-bold text-[14px] tracking-widest uppercase"
              style={{ color: 'var(--placeholder-color)' }}
            >
              OR
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-light)' }} />
          </div>

          <GoogleButton label="Continue with Google" />

          <p
            className="text-center font-medium text-[16px] m-0"
            style={{ color: 'var(--muted-color)' }}
          >
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
