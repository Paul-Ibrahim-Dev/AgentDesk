import { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { useBusiness } from '../../context/BusinessContext';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };

export default function BusinessProfile() {
  const { activeBusinessId, refresh } = useBusiness();
  const [form, setForm] = useState(null);
  const [hours, setHours] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!activeBusinessId) return;
    api.get(`/api/businesses/${activeBusinessId}`).then(({ business }) => {
      setForm({
        name: business.name || '',
        description: business.description || '',
        phone: business.phone || '',
        whatsapp_number: business.whatsapp_number || '',
        email: business.email || '',
        address: business.address || '',
        website: business.website || '',
      });
      setHours(business.opening_hours || {});
    });
  }, [activeBusinessId]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function updateHours(day, value) {
    setHours((h) => ({ ...h, [day]: value }));
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.put(`/api/businesses/${activeBusinessId}`, { ...form, opening_hours: hours });
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(err.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  if (!form) return <p className="text-gray-500">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-ink-900">Business Profile</h1>
      <p className="mt-1 text-sm text-gray-500">This information is used by your AI agent to answer customers.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="card p-6 space-y-4">
          <div>
            <label className="label">Business name</label>
            <input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Phone number</label>
              <input className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>
            <div>
              <label className="label">WhatsApp number</label>
              <input className="input" value={form.whatsapp_number} onChange={(e) => update('whatsapp_number', e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
            </div>
            <div>
              <label className="label">Website</label>
              <input className="input" value={form.website} onChange={(e) => update('website', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" value={form.address} onChange={(e) => update('address', e.target.value)} />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-ink-900 mb-4">Opening hours</h2>
          <div className="space-y-2">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-3">
                <span className="w-24 text-sm text-gray-600">{DAY_LABELS[day]}</span>
                <input
                  className="input"
                  placeholder="e.g. 9:00-18:00 or closed"
                  value={hours[day] || ''}
                  onChange={(e) => updateHours(day, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-brand-700">Saved.</p>}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
