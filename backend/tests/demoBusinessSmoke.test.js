import { jest } from '@jest/globals';

/**
 * End-to-end smoke test for the "Elite Cuts Minna" demo business.
 *
 * This exercises the REAL production pipeline — handleInboundMessage ->
 * runAgentTurn -> buildToolHandlers -> conversation/message persistence —
 * using the exact business, services, FAQs and agent config from
 * database/seed/seed_demo_business.sql (kept in sync by hand below since
 * this test runs against the in-memory fake DB, not a live Supabase
 * project). Only the Anthropic API call itself is mocked, one call per
 * "turn" the model would need to take.
 *
 * It walks through precisely the conversation script from the project
 * spec's manual test checklist:
 *   1. "What services do you offer?"          -> answered from real data
 *   2. "How much is a haircut?"                -> correct real price
 *   3. "I want to book a haircut for Saturday" -> a real booking is created
 *   4. "I want to speak with someone"          -> conversation escalates
 */

const mockCreate = jest.fn();
jest.unstable_mockModule('@anthropic-ai/sdk', () => ({
  default: class Anthropic {
    constructor() {
      this.messages = { create: mockCreate };
    }
  },
}));

const { createFakeSupabase } = await import('./fakeSupabase.js');
const fakeDb = createFakeSupabase();

jest.unstable_mockModule('../src/lib/supabaseClient.js', () => ({
  supabaseAdmin: fakeDb,
  supabaseForUser: () => fakeDb,
}));

const { handleInboundMessage } = await import('../src/services/conversationService.js');

const BUSINESS_ID = 'biz-elite-cuts';
const CHANNEL = 'web';
const THREAD_ID = 'smoke-thread-1';

function seedEliteCutsMinna() {
  fakeDb.__seed('businesses', [
    {
      id: BUSINESS_ID,
      name: 'Elite Cuts Minna',
      description: 'A modern barbershop in Minna offering precision haircuts, beard grooming and styling for men.',
      phone: '+2348012345678',
      whatsapp_number: '+2348012345678',
      address: '14 Bosso Road, Minna, Niger State',
      opening_hours: { mon: '9:00-19:00', tue: '9:00-19:00', wed: '9:00-19:00', thu: '9:00-19:00', fri: '9:00-19:00', sat: '9:00-18:00', sun: 'closed' },
    },
  ]);
  fakeDb.__seed('services', [
    { id: 'svc-haircut', business_id: BUSINESS_ID, name: 'Haircut', description: 'Classic or fade haircut, washed and styled.', price: 5000, duration_minutes: 30, booking_enabled: true, is_available: true },
    { id: 'svc-beard', business_id: BUSINESS_ID, name: 'Beard Trim', description: 'Beard shaping and line-up with hot towel finish.', price: 3000, duration_minutes: 20, booking_enabled: true, is_available: true },
    { id: 'svc-combo', business_id: BUSINESS_ID, name: 'Haircut + Beard', description: 'Full haircut and beard trim combo.', price: 7500, duration_minutes: 45, booking_enabled: true, is_available: true },
  ]);
  fakeDb.__seed('faqs', [
    { id: 'faq-1', business_id: BUSINESS_ID, question: 'What time do you close?', answer: 'We are open Monday–Saturday from 9 AM to 7 PM (6 PM on Saturdays). We are closed on Sundays.' },
    { id: 'faq-2', business_id: BUSINESS_ID, question: 'Where are you located?', answer: 'We are at 14 Bosso Road, Minna, Niger State.' },
  ]);
  fakeDb.__seed('agent_configs', [
    {
      id: 'cfg-1',
      business_id: BUSINESS_ID,
      agent_name: 'Elite Cuts Assistant',
      greeting: 'Hi, welcome to Elite Cuts Minna! How can I help you today?',
      tone: 'friendly',
      instructions: 'Be warm, brief and helpful. Only use the business information provided to you.',
      escalation_message: "Let me get Elite Cuts Minna's team to help you with that directly — they'll respond here shortly.",
      is_published: true,
    },
  ]);
  fakeDb.__seed('conversations', []);
  fakeDb.__seed('bookings', []);
  fakeDb.__seed('messages', []);
  fakeDb.__seed('escalations', []);
}

function lastAiMessage() {
  const aiMessages = fakeDb.__tables.messages.filter((m) => m.sender_type === 'ai');
  return aiMessages[aiMessages.length - 1];
}

beforeAll(() => {
  seedEliteCutsMinna();
});

beforeEach(() => {
  mockCreate.mockReset();
});

async function sendCustomerMessage(text) {
  return handleInboundMessage({
    businessId: BUSINESS_ID,
    channel: CHANNEL,
    externalThreadId: THREAD_ID,
    customerName: 'Musa',
    customerPhone: '08010000000',
    text,
  });
}

describe('Elite Cuts Minna — full demo conversation', () => {
  test('1. "What services do you offer?" is answered from real service data', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'tool_use', id: 't1', name: 'get_services', input: {} }],
    });
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'We offer Haircut, Beard Trim, and Haircut + Beard.' }],
    });

    const result = await sendCustomerMessage('What services do you offer?');

    expect(result.handedToHuman).toBe(false);
    expect(result.reply).toContain('Haircut');

    // Verify the tool actually ran against real seeded data (not just that
    // the model said something plausible).
    const aiMsg = lastAiMessage();
    const toolResult = aiMsg.tool_calls[0].result;
    expect(toolResult).toHaveLength(3);
    expect(toolResult.map((s) => s.name).sort()).toEqual(['Beard Trim', 'Haircut', 'Haircut + Beard']);
  });

  test('2. "How much is a haircut?" returns the real seeded price (₦5,000)', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'tool_use', id: 't2', name: 'get_service_details', input: { service_name: 'Haircut' } }],
    });
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'A Haircut is ₦5,000 and takes about 30 minutes.' }],
    });

    const result = await sendCustomerMessage('How much is a haircut?');

    expect(result.reply).toContain('5,000');

    const aiMsg = lastAiMessage();
    const toolResult = aiMsg.tool_calls[0].result;
    expect(toolResult.found).toBe(true);
    expect(toolResult.matches[0].price).toBe(5000);
  });

  test('3. "I want to book a haircut for Saturday" creates a real booking', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'tool_use',
          id: 't3',
          name: 'create_booking',
          input: {
            service_name: 'Haircut',
            customer_name: 'Musa',
            customer_phone: '08010000000',
            booking_date: '2026-09-12',
            booking_time: '10:00 AM',
          },
        },
      ],
    });
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: "You're booked for a Haircut on 2026-09-12 at 10:00 AM. See you then!" }],
    });

    const result = await sendCustomerMessage('I want to book a haircut for Saturday at 10am, I am Musa, 08010000000');

    expect(result.reply).toMatch(/booked/i);
    expect(result.handedToHuman).toBe(false);

    // The claim must be backed by a real row in the bookings table, scoped
    // to this business.
    const bookings = fakeDb.__tables.bookings.filter((b) => b.business_id === BUSINESS_ID);
    expect(bookings).toHaveLength(1);
    expect(bookings[0]).toMatchObject({
      customer_name: 'Musa',
      customer_phone: '08010000000',
      booking_date: '2026-09-12',
      booking_time: '10:00 AM',
      status: 'pending',
    });

    const aiMsg = lastAiMessage();
    expect(aiMsg.tool_calls[0].result.success).toBe(true);
  });

  test("4. \"I want to speak with someone\" hands the conversation to a human", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        { type: 'tool_use', id: 't4', name: 'request_human_help', input: { reason: 'customer_requested_human', details: 'Customer asked for a human.' } },
      ],
    });
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: "Sure — let me get Elite Cuts Minna's team to help you with that directly." }],
    });

    const result = await sendCustomerMessage('I want to speak with someone');

    expect(result.handedToHuman).toBe(true);
    expect(result.escalationReason).toBe('customer_requested_human');

    const conversation = fakeDb.__tables.conversations.find(
      (c) => c.business_id === BUSINESS_ID && c.external_thread_id === THREAD_ID
    );
    expect(conversation.status).toBe('human_required');

    // A fifth customer message after escalation should NOT reach the AI —
    // it should sit there for the owner to answer manually.
    const followUp = await sendCustomerMessage('Hello? Anyone there?');
    expect(followUp.handedToHuman).toBe(true);
    expect(followUp.reply).toBeNull();
    // No new mockCreate call should have been consumed for this follow-up.
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});
