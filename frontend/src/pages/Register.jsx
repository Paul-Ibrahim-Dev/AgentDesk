import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await signUp({ email, password });
      if (!data.session) {
        setNeedsConfirmation(true);
      } else {
        navigate('/dashboard/new-business', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (needsConfirmation) {
    return (
      <div className="surface-space min-h-[calc(100vh-4rem)]">
        <div className="container-page py-16 max-w-md">
          <h1 className="text-2xl font-display font-semibold text-paper">Check your email</h1>
          <p className="mt-3 text-paper/60">
            We've sent a confirmation link to <strong className="text-paper">{email}</strong>. Confirm your
            email, then log in to set up your business.
          </p>
          <Link to="/login" className="btn-primary mt-6 inline-flex">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-space min-h-[calc(100vh-4rem)]">
      <div className="container-page py-16 max-w-md">
        <h1 className="text-2xl font-display font-semibold text-paper">Create your AgentDesk account</h1>
        <p className="mt-2 text-sm text-paper/55">
          Set up your account, then add your business details in the next step.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="label-dark" htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              required
              className="input-dark"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label-dark" htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              required
              minLength={6}
              className="input-dark"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-paper/35">At least 6 characters.</p>
          </div>

          {error && <p className="text-sm text-amber-400">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-paper/45">
          Already have an account?{' '}
          <Link to="/login" className="text-signal-400 font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
