import { useEffect, useRef, useState } from 'react';
import { sendChatMessage } from '../lib/apiClient';

function genThreadId() {
  return `web-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

/**
 * ChatWidget talks to the REAL backend AI agent for a given businessId via
 * POST /api/chat/:businessId — the same route a production WhatsApp/website
 * integration would hit. `mode="preview"` instead calls the agent-config
 * preview endpoint so business owners can test changes before publishing.
 */
export default function ChatWidget({
  businessId,
  greeting = 'Hi! How can I help you today?',
  mode = 'live', // 'live' | 'preview'
  onPreviewMessage, // required when mode === 'preview': (message, history) => Promise<{reply}>
  storageKeyPrefix = 'agentdesk_chat_thread',
  heightClass = 'h-[520px]',
}) {
  const [threadId] = useState(() => {
    if (mode !== 'live') return null;
    const key = `${storageKeyPrefix}_${businessId}`;
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = genThreadId();
      sessionStorage.setItem(key, id);
    }
    return id;
  });

  const [messages, setMessages] = useState([{ role: 'assistant', content: greeting }]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [handedToHuman, setHandedToHuman] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setError(null);
    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      if (mode === 'preview') {
        const history = nextMessages
          .filter((m) => m !== nextMessages[0] || messages.length > 1)
          .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
        const result = await onPreviewMessage(text, history.slice(0, -1));
        setMessages((prev) => [...prev, { role: 'assistant', content: result.reply }]);
      } else {
        const result = await sendChatMessage({ businessId, threadId, text });
        if (result.reply) {
          setMessages((prev) => [...prev, { role: 'assistant', content: result.reply }]);
        }
        if (result.handedToHuman) setHandedToHuman(true);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`panel flex flex-col overflow-hidden ${heightClass}`}>
      <div className="border-b border-ink-600 px-4 py-3 bg-ink-800 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm text-paper flex items-center gap-2">
            <span className="dot-signal" />
            AgentDesk Assistant
          </p>
          <p className="text-xs text-paper/45">{handedToHuman ? 'Connecting you with the team…' : 'Usually replies instantly'}</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-ink-900">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-signal-500 text-ink-900 rounded-br-sm font-medium'
                  : 'bg-ink-800 border border-ink-600 text-paper/85 rounded-bl-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-ink-800 border border-ink-600 px-4 py-2 text-sm text-paper/40">
              Typing…
            </div>
          </div>
        )}
        {handedToHuman && (
          <div className="text-center text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg py-2 px-3">
            A team member has been notified and will follow up here.
          </div>
        )}
      </div>

      {error && <div className="px-4 py-2 text-xs text-amber-400 bg-amber-500/10 border-t border-amber-500/20">{error}</div>}

      <form onSubmit={handleSend} className="border-t border-ink-600 p-3 flex gap-2 bg-ink-800">
        <input
          className="input-dark"
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
        />
        <button type="submit" className="btn-primary" disabled={sending || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
