import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import GoogleButton from '../components/GoogleButton';
import { createAccount, login as loginApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function Field({ id, label, type = 'text', value, onChange, placeholder, required = true }) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="font-bold text-[13px] md:text-[14px] ml-1"
        style={{ color: 'var(--secondary-color)' }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full h-[52px] md:h-[56px] rounded-2xl focus:ring-4 focus:ring-[#b2def9]/10 focus:outline-none px-5 text-[14px] md:text-[15px] transition-all"
        style={{
          backgroundColor: 'var(--input-bg)',
          border: '1px solid var(--border-light)',
          color: 'var(--body-color)',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#b2def9';
          e.target.style.backgroundColor = 'var(--input-focus-bg)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--border-light)';
          e.target.style.backgroundColor = 'var(--input-bg)';
        }}
      />
    </div>
  );
}

export default function CreateAccount() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
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
      await createAccount({ username: username.trim(), email, password });
      const data = await loginApi({ email, password });
      signIn(data.access_token);
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg).join('. '));
      } else {
        setError(typeof detail === 'string' ? detail : 'Registration failed. Try again.');
      }
      setLoading(false);
    }
  }

  return (
    <div
      className="flex flex-col relative w-full min-h-screen"
      style={{ backgroundColor: 'var(--page-bg)', transition: 'background-color 0.3s' }}
    >
      <AppHeader links={[{ label: 'Login', to: '/login' }]} />

      <main className="flex-1 w-full flex items-start md:items-center justify-center px-4 md:px-0 pb-10">
        <div
          className="w-full max-w-[400px] md:max-w-[480px] rounded-[28px] md:rounded-[32px] p-6 md:p-12 shadow-sm flex flex-col gap-6 md:gap-[28px] relative overflow-hidden"
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

          <h1
            className="font-bold text-[32px] md:text-[40px] tracking-tight m-0 text-center pt-2"
            style={{ color: 'var(--heading-color)' }}
          >
            Create Account
          </h1>

          {error && (
            <div
              className="px-4 py-3 rounded-xl text-sm text-center"
              style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-color)' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-5">
            <Field id="username" label="Username" value={username} onChange={setUsername} placeholder="Choose a username" />
            <Field id="email" label="Email" type="email" value={email} onChange={setEmail} placeholder="Enter your email" />
            <Field id="password" label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
            <Field id="confirm-password" label="Confirm Password" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" />

            <button
              type="submit"
              disabled={loading}
              className="bg-[#b2def9] rounded-2xl shadow-md flex items-center justify-center w-full h-[56px] md:h-[60px] mt-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed border-none cursor-pointer"
            >
              <span className="font-bold text-[18px] md:text-[20px] text-white tracking-wide">
                {loading ? 'Creating account…' : 'Create Account'}
              </span>
            </button>
          </form>

          <div className="flex items-center gap-4 w-full">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-light)' }} />
            <span className="font-bold text-[12px]" style={{ color: 'var(--placeholder-color)' }}>OR</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-light)' }} />
          </div>

          <GoogleButton label="Sign up with Google" />

          <p className="text-center font-medium text-[14px] md:text-[16px] m-0" style={{ color: 'var(--muted-color)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#b2def9] hover:underline">
              Login
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
