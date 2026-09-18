import { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { useBusiness } from '../../context/BusinessContext';

const STATUS_OPTIONS = ['pending', 'confirmed', 'cancelled', 'completed'];
const STATUS_STYLE = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-brand-50 text-brand-700',
  cancelled: 'bg-red-50 text-red-700',
  completed: 'bg-gray-100 text-gray-600',
};

export default function Bookings() {
  const { activeBusinessId } = useBusiness();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  async function load() {
    setLoading(true);
    try {
      const qs = statusFilter ? `?status=${statusFilter}` : '';
      const { bookings: list } = await api.get(`/api/businesses/${activeBusinessId}/bookings${qs}`);
      setBookings(list || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeBusinessId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBusinessId, statusFilter]);

  async function updateStatus(bookingId, status) {
    await api.patch(`/api/businesses/${activeBusinessId}/bookings/${bookingId}`, { status });
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">Bookings your AI agent has captured from customers.</p>
        </div>
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 card overflow-hidden">
        {loading ? (
          <p className="p-5 text-sm text-gray-500">Loading…</p>
        ) : error ? (
          <p className="p-5 text-sm text-red-600">{error}</p>
        ) : bookings.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">No bookings yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-4 py-2 font-medium">Service</th>
                <th className="px-4 py-2 font-medium">Date &amp; time</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{b.customer_name}</p>
                    <p className="text-xs text-gray-500">{b.customer_phone}</p>
                  </td>
                  <td className="px-4 py-3">{b.services?.name || '—'}</td>
                  <td className="px-4 py-3">
                    {b.booking_date} · {b.booking_time}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className={`badge border-0 ${STATUS_STYLE[b.status] || 'bg-gray-100 text-gray-600'}`}
                      value={b.status}
                      onChange={(e) => updateStatus(b.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s[0].toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{b.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
