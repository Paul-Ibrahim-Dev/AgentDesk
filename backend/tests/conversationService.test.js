import { jest } from '@jest/globals';
import { createFakeSupabase } from './fakeSupabase.js';

const fakeDb = createFakeSupabase();

jest.unstable_mockModule('../src/lib/supabaseClient.js', () => ({
  supabaseAdmin: fakeDb,
  supabaseForUser: () => fakeDb,
}));

const mockCreate = jest.fn();
jest.unstable_mockModule('@anthropic-ai/sdk', () => ({
  default: class Anthropic {
    constructor() {
      this.messages = { create: mockCreate };
    }
  },
}));

const { handleInboundMessage } = await import('../src/services/conversationService.js');

beforeEach(() => {
  mockCreate.mockReset();
  fakeDb.__seed('businesses', [{ id: 'biz-A', name: 'Elite Cuts Minna' }]);
  fakeDb.__seed('services', [
    { id: 'svc-1', business_id: 'biz-A', name: 'Haircut', price: 5000, currency: 'NGN', is_available: true, booking_enabled: true },
  ]);
  fakeDb.__seed('faqs', []);
  fakeDb.__seed('agent_configs', [
    {
      id: 'cfg-1',
      business_id: 'biz-A',
      agent_name: 'Elite Cuts Assistant',
      greeting: 'Hi!',
      tone: 'friendly',
      escalation_message: 'Our team will help.',
      is_published: true,
    },
  ]);
  fakeDb.__seed('conversations', []);
  fakeDb.__seed('messages', []);
  fakeDb.__seed('bookings', []);
  fakeDb.__seed('escalations', []);
});

describe('handleInboundMessage', () => {
  test('creates a new conversation on first contact and stores both customer and AI messages', async () => {
    mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: 'Hi there! How can I help?' }] });

    const result = await handleInboundMessage({
      businessId: 'biz-A',
      channel: 'web',
      externalThreadId: 'visitor-123',
      customerName: 'Musa',
      text: 'Hello',
    });

    expect(result.reply).toBe('Hi there! How can I help?');
    expect(fakeDb.__tables.conversations).toHaveLength(1);
    expect(fakeDb.__tables.messages.map((m) => m.sender_type)).toEqual(['customer', 'ai']);
  });

  test('reuses the same conversation for the same thread id on a second message', async () => {
    mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: 'Reply 1' }] });
    await handleInboundMessage({ businessId: 'biz-A', channel: 'web', externalThreadId: 'visitor-123', text: 'Hi' });

    mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: 'Reply 2' }] });
    await handleInboundMessage({ businessId: 'biz-A', channel: 'web', externalThreadId: 'visitor-123', text: 'Follow up' });

    expect(fakeDb.__tables.conversations).toHaveLength(1);
    expect(fakeDb.__tables.messages).toHaveLength(4);
  });

  test('once escalated, the AI stops responding and the conversation is human_required', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'tool_use', id: 't1', name: 'request_human_help', input: { reason: 'customer_requested_human' } }],
    });
    mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: 'Connecting you with our team now.' }] });

    const first = await handleInboundMessage({
      businessId: 'biz-A',
      channel: 'web',
      externalThreadId: 'visitor-999',
      text: 'I want to talk to a human',
    });
    expect(first.handedToHuman).toBe(true);

    // Second message on the same thread — AI must NOT reply anymore.
    const second = await handleInboundMessage({
      businessId: 'biz-A',
      channel: 'web',
      externalThreadId: 'visitor-999',
      text: 'Hello? Anyone there?',
    });
    expect(second.reply).toBeNull();
    expect(second.handedToHuman).toBe(true);
    expect(mockCreate).toHaveBeenCalledTimes(2); // not called again for the 2nd message
  });

  test('falls back to human handoff with a clear message when no agent is published yet', async () => {
    fakeDb.__tables.agent_configs[0].is_published = false;

    const result = await handleInboundMessage({
      businessId: 'biz-A',
      channel: 'web',
      externalThreadId: 'visitor-1',
      text: 'Hi, are you open?',
    });

    expect(result.handedToHuman).toBe(true);
    expect(result.reply).toMatch(/team member will get back/);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
