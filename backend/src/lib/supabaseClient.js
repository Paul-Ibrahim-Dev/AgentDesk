import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// Service-role client: full DB access, bypasses RLS.
// ONLY ever used server-side (this file), NEVER sent to the browser.
export const supabaseAdmin = createClient(
  env.supabaseUrl || 'http://localhost:54321',
  env.supabaseServiceRoleKey || 'test-service-role-key',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Build a client scoped to the end-user's own JWT, so any query made with
// it is still subject to Row Level Security. Used for auth verification
// and for any route that should honour RLS instead of bypassing it.
export function supabaseForUser(accessToken) {
  return createClient(
    env.supabaseUrl || 'http://localhost:54321',
    env.supabaseAnonKey || 'test-anon-key',
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    }
  );
}
