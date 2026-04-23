import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import GradientStrip from '../components/GradientStrip';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar rightLink={{ to: '/create-account', label: 'Register' }} />

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
                marginBottom: '12px',
              }}
            >
              Forgot password?
            </h1>
            <p
              style={{
                textAlign: 'center',
                fontSize: '14px',
                color: '#666666',
                marginBottom: '32px',
                lineHeight: '1.5',
              }}
            >
              Enter your email address below and we&apos;ll send you a link to
              reset your password.
            </p>

            {submitted ? (
              <div
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: '#F0FDF4',
                  color: '#15803D',
                  fontSize: '14px',
                  textAlign: 'center',
                  marginBottom: '24px',
                }}
              >
                If an account exists with that email, a reset link has been sent.
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '24px' }}>
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

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '8px',
                    backgroundColor: '#F8B4C8',
                    color: '#ffffff',
                    fontWeight: '600',
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.backgroundColor = '#f5a0b8')
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.backgroundColor = '#F8B4C8')
                  }
                >
                  Send Reset Link
                </button>
              </form>
            )}

            <p
              style={{
                textAlign: 'center',
                fontSize: '14px',
                color: '#666666',
                marginTop: '28px',
              }}
            >
              <Link
                to="/login"
                style={{
                  color: '#F8B4C8',
                  fontWeight: '500',
                  textDecoration: 'none',
                }}
              >
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
