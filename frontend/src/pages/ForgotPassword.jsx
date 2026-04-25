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
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex flex-col relative w-full min-h-screen"
      style={{ backgroundColor: 'var(--page-bg)', transition: 'background-color 0.3s' }}
    >
      <AppHeader links={[{ label: 'Register', to: '/create-account' }]} />

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
              Forgot password?
            </h1>
            <p
              className="font-normal text-[16px] m-0 leading-relaxed max-w-[320px]"
              style={{ color: 'var(--secondary-color)' }}
            >
              Enter your email address below and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {submitted ? (
            <div
              className="px-4 py-4 rounded-xl text-sm text-center leading-relaxed"
              style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-color)' }}
            >
              If an account exists with that email, a reset link has been sent. Check your inbox
              (and spam folder).
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
                  htmlFor="email"
                  className="font-medium text-[14px]"
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
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </span>
              </button>
            </form>
          )}

          <div className="w-full flex justify-center">
            <Link
              to="/login"
              className="font-medium text-[16px] transition-colors"
              style={{ color: 'var(--secondary-color)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f9b2d7')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--secondary-color)')}
            >
              Back to Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
