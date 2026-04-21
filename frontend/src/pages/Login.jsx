import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import Navbar from '../components/Navbar';
import GradientStrip from '../components/GradientStrip';
import GoogleButton from '../components/GoogleButton';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login({ email, password });
      localStorage.setItem('access_token', data.access_token);
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === 'string' ? detail : 'Login failed. Check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar rightLink={{ to: '/create-account', label: 'Create Account' }} />

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div
          className="w-full overflow-hidden"
          style={{
            maxWidth: '420px',
            borderRadius: '16px',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
            backgroundColor: '#ffffff',
          }}
        >
          <GradientStrip />

          <div style={{ padding: '40px 36px 36px' }}>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: '700',
                textAlign: 'center',
                color: '#333333',
                marginBottom: '32px',
              }}
            >
              Login
            </h1>

            {error && (
              <div
                style={{
                  marginBottom: '20px',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  fontSize: '14px',
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333333',
                    marginBottom: '8px',
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#ffffff',
                    fontSize: '14px',
                    color: '#333333',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#F8B4C8')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <label
                    style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333333',
                    }}
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    style={{
                      fontSize: '12px',
                      color: '#F8B4C8',
                      textDecoration: 'none',
                    }}
                  >
                    Forgot?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#ffffff',
                    fontSize: '14px',
                    color: '#333333',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#F8B4C8')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: '#F8B4C8',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '14px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#f5a0b8';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#F8B4C8';
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                margin: '24px 0',
              }}
            >
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
              <span
                style={{
                  fontSize: '12px',
                  color: '#999999',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                or
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
            </div>

            <GoogleButton label="Continue with Google" />

            <p
              style={{
                textAlign: 'center',
                fontSize: '14px',
                color: '#666666',
                marginTop: '24px',
              }}
            >
              Don&apos;t have an account yet?{' '}
              <Link
                to="/create-account"
                style={{
                  color: '#F8B4C8',
                  fontWeight: '500',
                  textDecoration: 'none',
                }}
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
