import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import { useBusiness } from '../../context/BusinessContext';

const STATUS_STYLE = {
  ai_handling: 'bg-brand-50 text-brand-700',
  human_required: 'bg-amber-50 text-amber-700',
  human_handling: 'bg-blue-50 text-blue-700',
  resolved: 'bg-gray-100 text-gray-600',
};
const STATUS_LABEL = {
  ai_handling: 'AI handling',
  human_required: 'Needs you',
  human_handling: "You're handling",
  resolved: 'Resolved',
};

export default function Conversations() {
  const { activeBusinessId } = useBusiness();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!activeBusinessId) return;
    setLoading(true);
    const qs = statusFilter ? `?status=${statusFilter}` : '';
    api
      .get(`/api/businesses/${activeBusinessId}/conversations${qs}`)
      .then(({ conversations: list }) => setConversations(list || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [activeBusinessId, statusFilter]);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Conversations</h1>
          <p className="mt-1 text-sm text-gray-500">Every customer conversation, across WhatsApp and web chat.</p>
        </div>
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="ai_handling">AI handling</option>
          <option value="human_required">Needs you</option>
          <option value="human_handling">You're handling</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="mt-6 card overflow-hidden">
        {loading ? (
          <p className="p-5 text-sm text-gray-500">Loading…</p>
        ) : error ? (
          <p className="p-5 text-sm text-red-600">{error}</p>
        ) : conversations.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">No conversations yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link to={`/dashboard/conversations/${c.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-ink-900 text-sm">{c.customer_name || 'Unknown customer'}</p>
                    <p className="text-xs text-gray-500">
                      {c.customer_phone || 'No phone'} · {c.channel} ·{' '}
                      {c.last_message_at ? new Date(c.last_message_at).toLocaleString() : ''}
                    </p>
                  </div>
                  <span className={`badge ${STATUS_STYLE[c.status] || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABEL[c.status] || c.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
