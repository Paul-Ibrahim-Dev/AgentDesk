import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn({ email, password });
      const dest = location.state?.from?.pathname || '/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || 'Could not log in. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="surface-space min-h-[calc(100vh-4rem)]">
      <div className="container-page py-16 max-w-md">
        <h1 className="text-2xl font-display font-semibold text-paper">Log in</h1>
        <p className="mt-2 text-sm text-paper/55">Welcome back to your AgentDesk dashboard.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="label-dark" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              required
              className="input-dark"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="label-dark" htmlFor="login-password">Password</label>
              <Link to="/forgot-password" className="text-xs text-signal-400 hover:text-signal-300 mb-1.5">
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              required
              className="input-dark"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-sm text-amber-400">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-sm text-paper/45">
          Don't have an account?{' '}
          <Link to="/register" className="text-signal-400 font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
