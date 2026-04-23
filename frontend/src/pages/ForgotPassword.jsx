import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { forgotPassword } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword({ email });
      setSubmitted(true);
    } catch (err) {
      // The backend always returns success, so an error here is likely network-level.
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col relative w-full min-h-screen bg-[#Fafbfb]">
      <AppHeader links={[{ label: 'Register', to: '/create-account' }]} />

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
              Forgot password?
            </h1>
            <p className="font-normal text-[16px] text-[#555] m-0 leading-relaxed max-w-[320px]">
              Enter your email address below and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {submitted ? (
            <div className="px-4 py-4 rounded-xl bg-green-50 text-green-700 text-sm text-center leading-relaxed">
              If an account exists with that email, a reset link has been sent. Check your inbox
              (and spam folder).
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-[24px] mt-[8px]">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-[8px]">
                <label htmlFor="email" className="font-medium text-[14px] text-[#555]">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
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
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </span>
              </button>
            </form>
          )}

          <div className="w-full flex justify-center">
            <Link
              to="/login"
              className="font-medium text-[16px] text-[#555] hover:text-[#f9b2d7] transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
