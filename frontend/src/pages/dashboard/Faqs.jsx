import { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { useBusiness } from '../../context/BusinessContext';

const emptyForm = { question: '', answer: '' };

export default function Faqs() {
  const { activeBusinessId } = useBusiness();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { faqs: list } = await api.get(`/api/businesses/${activeBusinessId}/faqs`);
      setFaqs(list || []);
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

  function startEdit(faq) {
    setEditingId(faq.id);
    setForm({ question: faq.question, answer: faq.answer });
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
    try {
      if (editingId) {
        await api.put(`/api/businesses/${activeBusinessId}/faqs/${editingId}`, form);
      } else {
        await api.post(`/api/businesses/${activeBusinessId}/faqs`, form);
      }
      resetForm();
      await load();
    } catch (err) {
      setFormError(err.message || 'Could not save this FAQ.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this FAQ?')) return;
    await api.delete(`/api/businesses/${activeBusinessId}/faqs/${id}`);
    await load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">FAQs</h1>
      <p className="mt-1 text-sm text-gray-500">Your AI agent uses these to answer common customer questions.</p>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : faqs.length === 0 ? (
            <p className="text-sm text-gray-500">No FAQs yet — add your first one.</p>
          ) : (
            faqs.map((f) => (
              <div key={f.id} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-ink-900">{f.question}</p>
                    <p className="mt-1 text-sm text-gray-600">{f.answer}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" className="text-brand-700 text-xs font-medium" onClick={() => startEdit(f)}>
                      Edit
                    </button>
                    <button type="button" className="text-red-600 text-xs font-medium" onClick={() => handleDelete(f.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="card p-5 space-y-4 h-fit">
          <h2 className="font-semibold text-ink-900">{editingId ? 'Edit FAQ' : 'Add a FAQ'}</h2>
          <div>
            <label className="label">Question *</label>
            <input
              className="input"
              required
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
              placeholder="What time do you close?"
            />
          </div>
          <div>
            <label className="label">Answer *</label>
            <textarea
              className="input"
              rows={3}
              required
              value={form.answer}
              onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
              placeholder="We are open Monday–Saturday from 9 AM to 6 PM."
            />
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add FAQ'}
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
