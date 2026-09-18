import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import { useBusiness } from '../../context/BusinessContext';

export default function NewBusiness() {
  const navigate = useNavigate();
  const { businesses, refresh, setActiveBusinessId } = useBusiness();
  const [form, setForm] = useState({ name: '', phone: '', whatsapp_number: '', address: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { business } = await api.post('/api/businesses', form);
      await refresh();
      setActiveBusinessId(business.id);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not create your business.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-ink-900">
        {businesses.length === 0 ? 'Set up your business' : 'Add another business'}
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        This creates your AgentDesk workspace. You can fill in the rest of the details afterwards.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="label">Business name *</label>
          <input
            className="input"
            required
            placeholder="e.g. Elite Cuts Minna"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Phone number</label>
          <input
            className="input"
            placeholder="+234..."
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
        </div>
        <div>
          <label className="label">WhatsApp number</label>
          <input
            className="input"
            placeholder="+234..."
            value={form.whatsapp_number}
            onChange={(e) => update('whatsapp_number', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Address</label>
          <input
            className="input"
            placeholder="Street, city, state"
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Creating…' : 'Create business'}
        </button>
      </form>
    </div>
  );
}
