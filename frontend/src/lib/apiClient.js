import { supabase } from './supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Thin fetch wrapper used by every authenticated dashboard call.
 * Attaches the current Supabase session's access token as a bearer token —
 * this is exactly what backend/src/middleware/auth.js verifies.
 */
async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, json?.error || `Request failed (${res.status})`);
  }
  return json;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

export { ApiError, API_BASE_URL };

/**
 * Public, unauthenticated chat call — used by the demo/customer chat widget.
 * Does NOT attach a Supabase session (customers never log in).
 */
export async function sendChatMessage({ businessId, threadId, text, customerName, customerPhone }) {
  const res = await fetch(`${API_BASE_URL}/api/chat/${businessId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ threadId, text, customerName, customerPhone }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, json?.error || 'Could not send message.');
  }
  return json;
}
