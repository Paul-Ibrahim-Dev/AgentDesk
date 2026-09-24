import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ForgotPassword() {
  const { sendPasswordResetEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Could not send the reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="surface-space min-h-[calc(100vh-4rem)]">
        <div className="container-page py-16 max-w-md">
          <h1 className="text-2xl font-display font-semibold text-paper">Check your email</h1>
          <p className="mt-3 text-paper/60">
            If an account exists for <strong className="text-paper">{email}</strong>, we've sent a link to
            reset your password. Click it, then set a new password.
          </p>
          <Link to="/login" className="btn-secondary mt-6 inline-flex">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-space min-h-[calc(100vh-4rem)]">
      <div className="container-page py-16 max-w-md">
        <h1 className="text-2xl font-display font-semibold text-paper">Reset your password</h1>
        <p className="mt-2 text-sm text-paper/55">
          Enter the email on your account and we'll send you a link to set a new password.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="label-dark" htmlFor="forgot-email">Email</label>
            <input
              id="forgot-email"
              type="email"
              required
              className="input-dark"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          {error && <p className="text-sm text-amber-400">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-6 text-sm text-paper/45">
          Remembered it after all?{' '}
          <Link to="/login" className="text-signal-400 font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
