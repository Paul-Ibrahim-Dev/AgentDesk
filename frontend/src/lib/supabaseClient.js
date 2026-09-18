import { createClient } from '@supabase/supabase-js';

// The frontend talks to Supabase Auth directly using the PUBLIC anon key
// (safe to expose in the browser by design — it has no elevated access;
// Supabase's own Row Level Security is what protects data reads/writes).
// It NEVER touches the service-role key — that lives only on the backend.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabaseClient] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. ' +
      'Auth and dashboard features will not work until they are configured in frontend/.env'
  );
}

export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey || 'public-anon-key-not-configured',
  { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } }
);
