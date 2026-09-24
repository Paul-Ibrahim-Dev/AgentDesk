import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

/**
 * Landing page for the link Supabase emails after "forgot password".
 * Supabase's client (detectSessionInUrl: true, see lib/supabaseClient.js)
 * automatically reads the recovery token out of the URL and establishes a
 * temporary session, firing a PASSWORD_RECOVERY auth event — that's what
 * makes updatePassword() below work without the user "logging in" first.
 */
export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If the recovery link already processed by the time this mounts,
    // getSession() will resolve with it — this just avoids flashing the
    // form before we know a session exists.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not update your password. The link may have expired — request a new one.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="surface-space min-h-[calc(100vh-4rem)]">
      <div className="container-page py-16 max-w-md">
        <h1 className="text-2xl font-display font-semibold text-paper">Set a new password</h1>

        {!ready && (
          <p className="mt-3 text-sm text-paper/50">
            Waiting to confirm your reset link… if this doesn't update in a few seconds, the link may
            be invalid or expired — go back and request a new one.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="label-dark" htmlFor="reset-password">New password</label>
            <input
              id="reset-password"
              type="password"
              required
              minLength={6}
              className="input-dark"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="label-dark" htmlFor="reset-confirm">Confirm new password</label>
            <input
              id="reset-confirm"
              type="password"
              required
              minLength={6}
              className="input-dark"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-sm text-amber-400">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
