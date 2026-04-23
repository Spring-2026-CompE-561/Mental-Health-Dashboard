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

  // No token in the URL — the user likely got here by accident.
  if (!token) {
    return (
      <div className="flex flex-col relative w-full min-h-screen bg-[#Fafbfb]">
        <AppHeader links={[{ label: 'Login', to: '/login' }]} />
        <main className="flex-1 w-full flex items-center justify-center p-[40px]">
          <div className="w-full max-w-[480px] bg-white border border-gray-100 rounded-[32px] p-[48px] shadow-sm text-center">
            <h1 className="font-semibold text-[28px] text-[#222] mb-4">Invalid reset link</h1>
            <p className="text-[#555] mb-6">
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
    <div className="flex flex-col relative w-full min-h-screen bg-[#Fafbfb]">
      <AppHeader links={[{ label: 'Login', to: '/login' }]} />

      <main className="flex-1 w-full flex items-center justify-center p-[40px]">
        <div className="w-full max-w-[480px] bg-white border border-gray-100 rounded-[32px] p-[48px] shadow-sm flex flex-col gap-[32px] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[6px] flex">
            <div className="flex-1 bg-[#f9b2d7]" />
            <div className="flex-1 bg-[#b2def9]" />
            <div className="flex-1 bg-[#b2f9c8]" />
            <div className="flex-1 bg-[#f9f0b2]" />
          </div>

          <div className="flex flex-col gap-[12px] items-center text-center">
            <h1 className="font-semibold text-[36px] text-[#222] tracking-tight m-0">
              Reset password
            </h1>
            <p className="font-normal text-[16px] text-[#555] m-0 leading-relaxed max-w-[320px]">
              Choose a new password for your account.
            </p>
          </div>

          {success ? (
            <div className="px-4 py-4 rounded-xl bg-green-50 text-green-700 text-sm text-center">
              Password reset successfully. Redirecting to login…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-[24px] mt-[8px]">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-[8px]">
                <label htmlFor="password" className="font-medium text-[14px] text-[#555]">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-[56px] border border-gray-200 rounded-[16px] bg-gray-50 focus:border-[#b2def9] focus:bg-white focus:outline-none px-[20px] text-[16px] text-[#333] placeholder:text-[#aaa] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-[8px]">
                <label htmlFor="confirm-password" className="font-medium text-[14px] text-[#555]">
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-[56px] border border-gray-200 rounded-[16px] bg-gray-50 focus:border-[#b2def9] focus:bg-white focus:outline-none px-[20px] text-[16px] text-[#333] placeholder:text-[#aaa] transition-colors"
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
