import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { resetPassword } from '../services/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, newPassword: password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === 'string' ? detail : 'Could not reset password. The link may have expired.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div
        className="flex flex-col relative w-full min-h-screen"
        style={{ backgroundColor: 'var(--page-bg)', transition: 'background-color 0.3s' }}
      >
        <AppHeader links={[{ label: 'Login', to: '/login' }]} />
        <main className="flex-1 w-full flex items-center justify-center p-[40px]">
          <div
            className="w-full max-w-[480px] rounded-[32px] p-[48px] shadow-sm text-center"
            style={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-light)',
            }}
          >
            <h1 className="font-semibold text-[28px] mb-4" style={{ color: 'var(--heading-color)' }}>
              Invalid reset link
            </h1>
            <p className="mb-6" style={{ color: 'var(--secondary-color)' }}>
              This link is missing a reset token. Request a new one from the forgot-password page.
            </p>
            <Link
              to="/forgot-password"
              className="inline-block bg-[#b2def9] text-white font-semibold px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity"
            >
              Request new link
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col relative w-full min-h-screen"
      style={{ backgroundColor: 'var(--page-bg)', transition: 'background-color 0.3s' }}
    >
      <AppHeader links={[{ label: 'Login', to: '/login' }]} />

      <main className="flex-1 w-full flex items-center justify-center p-[40px]">
        <div
          className="w-full max-w-[480px] rounded-[32px] p-[48px] shadow-sm flex flex-col gap-[32px] relative overflow-hidden"
          style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-light)',
            transition: 'background-color 0.3s, border-color 0.3s',
          }}
        >
          <div className="absolute top-0 left-0 w-full h-[6px] flex">
            <div className="flex-1 bg-[#f9b2d7]" />
            <div className="flex-1 bg-[#b2def9]" />
            <div className="flex-1 bg-[#b2f9c8]" />
            <div className="flex-1 bg-[#f9f0b2]" />
          </div>

          <div className="flex flex-col gap-[12px] items-center text-center">
            <h1
              className="font-semibold text-[36px] tracking-tight m-0"
              style={{ color: 'var(--heading-color)' }}
            >
              Reset password
            </h1>
            <p
              className="font-normal text-[16px] m-0 leading-relaxed max-w-[320px]"
              style={{ color: 'var(--secondary-color)' }}
            >
              Choose a new password for your account.
            </p>
          </div>

          {success ? (
            <div
              className="px-4 py-4 rounded-xl text-sm text-center"
              style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-color)' }}
            >
              Password reset successfully. Redirecting to login…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-[24px] mt-[8px]">
              {error && (
                <div
                  className="px-4 py-3 rounded-xl text-sm text-center"
                  style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-color)' }}
                >
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-[8px]">
                <label
                  htmlFor="password"
                  className="font-medium text-[14px]"
                  style={{ color: 'var(--secondary-color)' }}
                >
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-[56px] rounded-[16px] focus:outline-none px-[20px] text-[16px] transition-colors"
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

              <div className="flex flex-col gap-[8px]">
                <label
                  htmlFor="confirm-password"
                  className="font-medium text-[14px]"
                  style={{ color: 'var(--secondary-color)' }}
                >
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-[56px] rounded-[16px] focus:outline-none px-[20px] text-[16px] transition-colors"
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
                className="bg-[#b2def9] rounded-[16px] shadow-[0px_8px_24px_rgba(178,222,249,0.4)] flex items-center justify-center w-full h-[60px] mt-[8px] hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed border-none cursor-pointer"
              >
                <span className="font-semibold text-[20px] text-white tracking-wide">
                  {loading ? 'Resetting…' : 'Reset Password'}
                </span>
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
