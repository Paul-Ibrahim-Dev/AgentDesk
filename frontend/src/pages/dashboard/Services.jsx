import { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { useBusiness } from '../../context/BusinessContext';

const emptyForm = { name: '', description: '', price: '', duration_minutes: '', booking_enabled: true, is_available: true };

export default function Services() {
  const { activeBusinessId } = useBusiness();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { services: list } = await api.get(`/api/businesses/${activeBusinessId}/services`);
      setServices(list || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeBusinessId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBusinessId]);

  function startEdit(service) {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description || '',
      price: service.price ?? '',
      duration_minutes: service.duration_minutes ?? '',
      booking_enabled: service.booking_enabled,
      is_available: service.is_available,
    });
    setFormError(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      price: form.price === '' ? null : Number(form.price),
      duration_minutes: form.duration_minutes === '' ? null : Number(form.duration_minutes),
      booking_enabled: form.booking_enabled,
      is_available: form.is_available,
    };
    try {
      if (editingId) {
        await api.put(`/api/businesses/${activeBusinessId}/services/${editingId}`, payload);
      } else {
        await api.post(`/api/businesses/${activeBusinessId}/services`, payload);
      }
      resetForm();
      await load();
    } catch (err) {
      setFormError(err.message || 'Could not save this service.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this service?')) return;
    await api.delete(`/api/businesses/${activeBusinessId}/services/${id}`);
    await load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Services</h1>
      <p className="mt-1 text-sm text-gray-500">Services your AI agent can describe and take bookings for.</p>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card overflow-hidden">
          {loading ? (
            <p className="p-5 text-sm text-gray-500">Loading…</p>
          ) : error ? (
            <p className="p-5 text-sm text-red-600">{error}</p>
          ) : services.length === 0 ? (
            <p className="p-5 text-sm text-gray-500">No services yet — add your first one.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Price</th>
                  <th className="px-4 py-2 font-medium">Duration</th>
                  <th className="px-4 py-2 font-medium">Bookable</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {services.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-900">{s.name}</p>
                      {s.description && <p className="text-xs text-gray-500">{s.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {s.price != null ? `₦${Number(s.price).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3">{s.duration_minutes ? `${s.duration_minutes} min` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${s.booking_enabled && s.is_available ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.booking_enabled && s.is_available ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button type="button" className="text-brand-700 text-xs font-medium" onClick={() => startEdit(s)}>
                        Edit
                      </button>
                      <button type="button" className="text-red-600 text-xs font-medium" onClick={() => handleDelete(s.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <form onSubmit={handleSubmit} className="card p-5 space-y-4 h-fit">
          <h2 className="font-semibold text-ink-900">{editingId ? 'Edit service' : 'Add a service'}</h2>
          <div>
            <label className="label">Name *</label>
            <input className="input" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Haircut" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Price (₦)</label>
              <input className="input" type="number" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="5000" />
            </div>
            <div>
              <label className="label">Duration (min)</label>
              <input className="input" type="number" min="0" value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))} placeholder="30" />
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.booking_enabled} onChange={(e) => setForm((f) => ({ ...f, booking_enabled: e.target.checked }))} />
              Booking enabled
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_available} onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))} />
              Available
            </label>
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add service'}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
