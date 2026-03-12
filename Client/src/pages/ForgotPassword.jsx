import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import api from '../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: password
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/dashboard');
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.email) {
        setError('Please enter your email');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email');
        return;
      }

      await api.post('/auth/forgot-password', { email: formData.email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.code) {
        setError('Please enter the verification code');
        return;
      }

      await api.post('/auth/verify-reset-code', { 
        email: formData.email, 
        code: formData.code 
      });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.newPassword || !formData.confirmPassword) {
        setError('Please fill in all password fields');
        return;
      }

      if (formData.newPassword.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      await api.post('/auth/reset-password', {
        email: formData.email,
        code: formData.code,
        newPassword: formData.newPassword
      });

      // Success - redirect to login
      navigate('/login', { 
        state: { message: 'Password reset successfully! Please log in with your new password.' }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Forgot Password?</h1>
      <p className="mt-2 text-sm text-slate-600">
        Enter your email to receive a verification code
      </p>

      <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none ring-brand-500 transition focus:ring-2"
            required
          />
        </div>

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Sending...' : 'Send Verification Code'}
        </button>
      </form>
    </>
  );

  const renderStep2 = () => (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Enter Verification Code</h1>
      <p className="mt-2 text-sm text-slate-600">
        We sent a 6-digit code to {formData.email}
      </p>

      <form onSubmit={handleCodeSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="code" className="mb-1 block text-sm font-medium text-slate-700">
            Verification Code
          </label>
          <input
            type="text"
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="123456"
            maxLength={6}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none ring-brand-500 transition focus:ring-2 text-center text-lg tracking-widest"
            required
          />
        </div>

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </button>

        <button
          type="button"
          onClick={() => handleEmailSubmit({ preventDefault: () => {} })}
          disabled={loading}
          className="w-full text-sm text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50"
        >
          Resend Code
        </button>

        <button
          type="button"
          onClick={() => setStep(1)}
          className="w-full text-sm text-slate-600 hover:text-slate-700 font-medium"
        >
          Back to Email
        </button>
      </form>
    </>
  );

  const renderStep3 = () => (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Set New Password</h1>
      <p className="mt-2 text-sm text-slate-600">
        Enter your new password below
      </p>

      <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-slate-700">
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            minLength={6}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none ring-brand-500 transition focus:ring-2"
            required
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-slate-700">
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            minLength={6}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none ring-brand-500 transition focus:ring-2"
            required
          />
        </div>

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </>
  );

  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      <p className="mt-4 text-sm text-slate-600">
        Remember your password?{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </section>
  );
}
