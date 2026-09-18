import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import { useBusiness } from '../../context/BusinessContext';

const STATUS_LABELS = {
  ai_handling: { label: 'AI handling', className: 'bg-brand-50 text-brand-700' },
  human_required: { label: 'Needs you', className: 'bg-amber-50 text-amber-700' },
  human_handling: { label: 'You\'re handling', className: 'bg-blue-50 text-blue-700' },
  resolved: { label: 'Resolved', className: 'bg-gray-100 text-gray-600' },
};

function StatCard({ label, value }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-ink-900">{value}</p>
    </div>
  );
}

export default function Overview() {
  const { activeBusinessId } = useBusiness();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeBusinessId) return;
    setLoading(true);
    api
      .get(`/api/businesses/${activeBusinessId}/overview`)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [activeBusinessId]);

  if (loading) return <p className="text-gray-500">Loading overview…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Overview</h1>
      <p className="mt-1 text-sm text-gray-500">A quick look at what's happening with your front desk.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total conversations" value={data.totalConversations} />
        <StatCard label="New enquiries (24h)" value={data.newEnquiries24h} />
        <StatCard label="Bookings" value={data.totalBookings} />
        <StatCard label="Needs your attention" value={data.pendingHumanFollowUps} />
      </div>

      <div className="mt-8 card">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-ink-900">Recent conversations</h2>
          <Link to="/dashboard/conversations" className="text-sm text-brand-700 font-medium">
            View all
          </Link>
        </div>
        {data.recentConversations.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">No conversations yet. Share your WhatsApp number or demo link to get started.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.recentConversations.map((c) => {
              const status = STATUS_LABELS[c.status] || { label: c.status, className: 'bg-gray-100 text-gray-600' };
              return (
                <li key={c.id}>
                  <Link
                    to={`/dashboard/conversations/${c.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-ink-900 text-sm">{c.customer_name || 'Unknown customer'}</p>
                      <p className="text-xs text-gray-500">
                        {c.customer_phone || 'No phone'} · {c.channel}
                      </p>
                    </div>
                    <span className={`badge ${status.className}`}>{status.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
