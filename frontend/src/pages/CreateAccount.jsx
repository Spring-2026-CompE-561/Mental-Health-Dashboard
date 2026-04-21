import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createAccount } from '../services/api';
import Navbar from '../components/Navbar';
import GradientStrip from '../components/GradientStrip';
import GoogleButton from '../components/GoogleButton';

export default function CreateAccount() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    setLoading(true);

    try {
      await createAccount({ username: username.trim(), email, password });
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg).join('. '));
      } else {
        setError(
          typeof detail === 'string' ? detail : 'Registration failed. Try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
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
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333333',
    marginBottom: '8px',
  };

  function handleFocus(e) {
    e.target.style.borderColor = '#B4D8F0';
  }

  function handleBlur(e) {
    e.target.style.borderColor = '#E5E7EB';
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar rightLink={{ to: '/login', label: 'Login' }} />

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

          <div style={{ padding: '36px 36px 32px' }}>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: '700',
                textAlign: 'center',
                color: '#333333',
                marginBottom: '28px',
              }}
            >
              Create Account
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
              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  required
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: '#B4D8F0',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '14px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#a0cce8';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#B4D8F0';
                }}
              >
                {loading ? 'Creating account...' : 'Create Account'}
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

            <GoogleButton label="Sign up with Google" />

            <p
              style={{
                textAlign: 'center',
                fontSize: '14px',
                color: '#666666',
                marginTop: '24px',
              }}
            >
              Already have an account?{' '}
              <Link
                to="/login"
                style={{
                  color: '#F8B4C8',
                  fontWeight: '500',
                  textDecoration: 'none',
                }}
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
