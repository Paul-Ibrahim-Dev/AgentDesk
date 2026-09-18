import { supabaseAdmin, supabaseForUser } from '../lib/supabaseClient.js';

/**
 * requireAuth: verifies the bearer token against Supabase Auth and attaches
 * req.user + a per-user Supabase client (req.supabase) that respects RLS.
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing bearer token.' });
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    req.user = data.user;
    req.accessToken = token;
    req.supabase = supabaseForUser(token); // RLS-respecting client for this request
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * requireBusinessMembership: ensures the authenticated user belongs to
 * :businessId (or ?businessId= / body.businessId) before letting the
 * request through. This is the core multi-tenant guardrail on top of RLS.
 */
export async function requireBusinessMembership(req, res, next) {
  try {
    const businessId =
      req.params.businessId || req.query.businessId || req.body.businessId;

    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required.' });
    }

    const { data, error } = await supabaseAdmin
      .from('business_members')
      .select('id, role')
      .eq('business_id', businessId)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(403).json({ error: 'You do not have access to this business.' });
    }

    req.businessId = businessId;
    req.businessRole = data.role;
    next();
  } catch (err) {
    next(err);
  }
}
