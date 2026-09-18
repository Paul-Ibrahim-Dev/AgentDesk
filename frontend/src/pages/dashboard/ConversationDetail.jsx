import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import { useBusiness } from '../../context/BusinessContext';

const SENDER_STYLE = {
  customer: 'justify-start',
  ai: 'justify-end',
  owner: 'justify-end',
};

const SENDER_BUBBLE = {
  customer: 'bg-white border border-gray-200 rounded-bl-sm',
  ai: 'bg-brand-600 text-white rounded-br-sm',
  owner: 'bg-ink-900 text-white rounded-br-sm',
};

export default function ConversationDetail() {
  const { activeBusinessId } = useBusiness();
  const { conversationId } = useParams();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  async function load() {
    const data = await api.get(`/api/businesses/${activeBusinessId}/conversations/${conversationId}`);
    setConversation(data.conversation);
    setMessages(data.messages || []);
  }

  useEffect(() => {
    if (activeBusinessId && conversationId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBusinessId, conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function handleReply(e) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    setError(null);
    try {
      await api.post(`/api/businesses/${activeBusinessId}/conversations/${conversationId}/reply`, { text: reply });
      setReply('');
      await load();
    } catch (err) {
      setError(err.message || 'Could not send your reply.');
    } finally {
      setSending(false);
    }
  }

  async function handleTakeOver() {
    await api.post(`/api/businesses/${activeBusinessId}/conversations/${conversationId}/take-over`, {});
    await load();
  }

  async function handleResolve() {
    await api.post(`/api/businesses/${activeBusinessId}/conversations/${conversationId}/resolve`, {});
    await load();
  }

  if (!conversation) return <p className="text-gray-500">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <Link to="/dashboard/conversations" className="text-sm text-brand-700">
        ← Back to conversations
      </Link>

      <div className="mt-3 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">{conversation.customer_name || 'Unknown customer'}</h1>
          <p className="text-sm text-gray-500">
            {conversation.customer_phone || 'No phone'} · {conversation.channel} · status: {conversation.status}
            {conversation.escalation_reason && ` (${conversation.escalation_reason})`}
          </p>
        </div>
        <div className="flex gap-2">
          {conversation.status !== 'human_handling' && (
            <button type="button" className="btn-secondary" onClick={handleTakeOver}>
              Take over
            </button>
          )}
          {conversation.status !== 'resolved' && (
            <button type="button" className="btn-secondary" onClick={handleResolve}>
              Mark resolved
            </button>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="mt-4 card h-[440px] overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${SENDER_STYLE[m.sender_type] || 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${SENDER_BUBBLE[m.sender_type] || 'bg-white border border-gray-200'}`}>
              <p className="text-[10px] uppercase tracking-wide opacity-70 mb-1">{m.sender_type}</p>
              {m.content}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleReply} className="mt-3 flex gap-2">
        <input
          className="input"
          placeholder="Reply as the business owner…"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          disabled={sending}
        />
        <button type="submit" className="btn-primary" disabled={sending || !reply.trim()}>
          Send
        </button>
      </form>
      <p className="mt-2 text-xs text-gray-400">
        Sending a reply automatically marks this conversation as "You're handling" and pushes your message out over{' '}
        {conversation.channel}.
      </p>
    </div>
  );
}
