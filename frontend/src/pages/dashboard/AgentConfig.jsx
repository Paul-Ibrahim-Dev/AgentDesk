import { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { useBusiness } from '../../context/BusinessContext';
import ChatWidget from '../../components/ChatWidget';

export default function AgentConfig() {
  const { activeBusinessId } = useBusiness();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!activeBusinessId) return;
    api.get(`/api/businesses/${activeBusinessId}/agent-config`).then(({ agentConfig }) => {
      setForm({
        agent_name: agentConfig?.agent_name || '',
        greeting: agentConfig?.greeting || '',
        tone: agentConfig?.tone || 'friendly',
        instructions: agentConfig?.instructions || '',
        escalation_message: agentConfig?.escalation_message || '',
        is_published: agentConfig?.is_published ?? false,
      });
    });
  }, [activeBusinessId]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.put(`/api/businesses/${activeBusinessId}/agent-config`, form);
      setSaved(true);
    } catch (err) {
      setError(err.message || 'Could not save your agent configuration.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePreviewMessage(message, history) {
    return api.post(`/api/businesses/${activeBusinessId}/agent-config/preview`, { message, history });
  }

  if (!form) return <p className="text-gray-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">AI Agent</h1>
      <p className="mt-1 text-sm text-gray-500">
        Configure how your AI front desk sounds and behaves, then preview it before publishing.
      </p>

      <div className="mt-6 grid lg:grid-cols-2 gap-6 items-start">
        <form onSubmit={handleSave} className="card p-6 space-y-4">
          <div>
            <label className="label">Agent name</label>
            <input className="input" value={form.agent_name} onChange={(e) => update('agent_name', e.target.value)} />
          </div>
          <div>
            <label className="label">Greeting</label>
            <textarea className="input" rows={2} value={form.greeting} onChange={(e) => update('greeting', e.target.value)} />
          </div>
          <div>
            <label className="label">Tone</label>
            <select className="input" value={form.tone} onChange={(e) => update('tone', e.target.value)}>
              <option value="friendly">Friendly</option>
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
              <option value="professional">Professional</option>
            </select>
          </div>
          <div>
            <label className="label">Additional instructions</label>
            <textarea
              className="input"
              rows={4}
              value={form.instructions}
              onChange={(e) => update('instructions', e.target.value)}
              placeholder="Any extra guidance for how the agent should behave."
            />
          </div>
          <div>
            <label className="label">Escalation message</label>
            <textarea
              className="input"
              rows={2}
              value={form.escalation_message}
              onChange={(e) => update('escalation_message', e.target.value)}
              placeholder="Let me get someone from our team to help you with that."
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_published} onChange={(e) => update('is_published', e.target.checked)} />
            Published (customers can talk to this agent)
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-brand-700">Saved.</p>}

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save agent configuration'}
          </button>
        </form>

        <div>
          <p className="label">Live preview (uses your saved services &amp; FAQs, even if unpublished)</p>
          <ChatWidget
            businessId={activeBusinessId}
            greeting={form.greeting || 'Hi! How can I help you today?'}
            mode="preview"
            onPreviewMessage={handlePreviewMessage}
            heightClass="h-[480px]"
          />
        </div>
      </div>
    </div>
  );
}
