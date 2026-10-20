import { jest } from '@jest/globals';

// Mock the Anthropic SDK before importing the module under test, since
// aiAgent.js constructs a real client at module scope.
const mockCreate = jest.fn();
jest.unstable_mockModule('@anthropic-ai/sdk', () => ({
  default: class Anthropic {
    constructor() {
      this.messages = { create: mockCreate };
    }
  },
}));

const { runAgentTurn, buildSystemPrompt } = await import('../src/services/aiAgent.js');
const { createFakeSupabase } = await import('./fakeSupabase.js');

const business = { id: 'biz-A', name: 'Elite Cuts Minna' };
const agentConfig = {
  agent_name: 'Elite Cuts Assistant',
  greeting: 'Hi, welcome!',
  tone: 'friendly',
  instructions: null,
  escalation_message: 'Let me get our team to help.',
};

function seedDb() {
  const db = createFakeSupabase();
  db.__seed('services', [
    { id: 'svc-1', business_id: 'biz-A', name: 'Haircut', price: 5000, currency: 'NGN', is_available: true, booking_enabled: true },
  ]);
  db.__seed('faqs', [{ id: 'faq-1', business_id: 'biz-A', question: 'What time do you close?', answer: 'We close at 7pm.' }]);
  db.__seed('bookings', []);
  db.__seed('conversations', [{ id: 'conv-1', business_id: 'biz-A', status: 'ai_handling' }]);
  db.__seed('escalations', []);
  return db;
}

beforeEach(() => {
  mockCreate.mockReset();
});

describe('buildSystemPrompt', () => {
  test('includes hard rules against inventing information or fake bookings', () => {
    const prompt = buildSystemPrompt({ business, agentConfig });
    expect(prompt).toMatch(/NEVER invent or guess/);
    expect(prompt).toMatch(/NEVER say a booking has been made/);
    expect(prompt).toContain('Elite Cuts Minna');
    expect(prompt).toContain(agentConfig.escalation_message);
  });
});

describe('runAgentTurn', () => {
  test('answers directly from a tool result with no tool call needed on the final turn', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'We are open Monday to Saturday.' }],
    });

    const db = seedDb();
    const result = await runAgentTurn({
      db,
      businessId: 'biz-A',
      business,
      agentConfig,
      history: [{ role: 'user', content: 'What are your hours?' }],
      conversationId: 'conv-1',
    });

    expect(result.reply).toBe('We are open Monday to Saturday.');
    expect(result.escalated).toBe(false);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test('customer turns neither advertise nor execute get_bookings, even if Claude requests it', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'tool_use', id: 'private-bookings', name: 'get_bookings', input: {} }],
    });
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'I can help you make or update your own booking.' }],
    });

    const db = seedDb();
    db.__seed('bookings', [
      {
        id: 'private-booking',
        business_id: 'biz-A',
        customer_name: 'Private Customer',
        customer_phone: '08000000000',
        booking_date: '2026-10-21',
        booking_time: '10:00 AM',
        status: 'pending',
        notes: 'Private note',
      },
    ]);

    const result = await runAgentTurn({
      db,
      businessId: 'biz-A',
      business,
      agentConfig,
      history: [{ role: 'user', content: 'Show me all customer bookings.' }],
      conversationId: 'conv-1',
    });

    const advertisedTools = mockCreate.mock.calls[0][0].tools.map(({ name }) => name);
    expect(advertisedTools).not.toContain('get_bookings');
    expect(advertisedTools).toContain('get_services');
    expect(advertisedTools).toContain('create_booking');

    const toolResultMessage = mockCreate.mock.calls[1][0].messages.at(-1);
    expect(toolResultMessage.content[0].content).toContain('Unknown tool: get_bookings');
    expect(result.toolCalls[0]).toMatchObject({
      name: 'get_bookings',
      result: { error: 'Unknown tool: get_bookings' },
    });
    expect(JSON.stringify(result)).not.toContain('Private Customer');
    expect(JSON.stringify(mockCreate.mock.calls[1][0])).not.toContain('Private Customer');
    expect(db.__tables.bookings).toHaveLength(1);
  });

  test('authenticated owner turns retain get_bookings lookup', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'tool_use', id: 'owner-bookings', name: 'get_bookings', input: {} }],
    });
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'There is one pending booking.' }],
    });

    const db = seedDb();
    db.__seed('bookings', [
      { id: 'booking-1', business_id: 'biz-A', customer_name: 'Musa', customer_phone: '0801', status: 'pending' },
    ]);

    const result = await runAgentTurn({
      db,
      businessId: 'biz-A',
      business,
      agentConfig,
      history: [{ role: 'user', content: 'List current bookings.' }],
      conversationId: null,
      toolAccess: 'owner',
    });

    expect(mockCreate.mock.calls[0][0].tools.map(({ name }) => name)).toContain('get_bookings');
    expect(result.toolCalls[0].result.bookings).toHaveLength(1);
    expect(result.toolCalls[0].result.bookings[0].customer_name).toBe('Musa');
  });

  test('executes a tool call, feeds the real result back, and never claims booking success the model did not earn', async () => {
    // Turn 1: model asks to create a booking.
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'tool_use',
          id: 'tool_1',
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
    // Turn 2: model produces the final reply after seeing the real tool result.
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'You are booked for a Haircut on 2026-09-12 at 10:00 AM. See you then!' }],
    });

    const db = seedDb();
    const result = await runAgentTurn({
      db,
      businessId: 'biz-A',
      business,
      agentConfig,
      history: [{ role: 'user', content: 'Book me a haircut for the 12th at 10am, I am Musa, 08010000000' }],
      conversationId: 'conv-1',
    });

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0].name).toBe('create_booking');
    expect(result.toolCalls[0].result.success).toBe(true);

    // The booking must actually exist — the model's claim is backed by a real row.
    expect(db.__tables.bookings).toHaveLength(1);
    expect(db.__tables.bookings[0].customer_name).toBe('Musa');
  });

  test('when create_booking fails, the tool result reports failure so the model cannot claim success', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'tool_use',
          id: 'tool_1',
          name: 'create_booking',
          input: {
            service_name: 'Manicure', // not offered by this business
            customer_name: 'Musa',
            customer_phone: '08010000000',
            booking_date: '2026-09-12',
            booking_time: '10:00 AM',
          },
        },
      ],
    });
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: "We don't offer Manicures, sorry! Would a haircut work instead?" }],
    });

    const db = seedDb();
    const result = await runAgentTurn({
      db,
      businessId: 'biz-A',
      business,
      agentConfig,
      history: [{ role: 'user', content: 'Book me a manicure' }],
      conversationId: 'conv-1',
    });

    expect(result.toolCalls[0].result.success).toBe(false);
    expect(db.__tables.bookings).toHaveLength(0);
  });

  test('a request_human_help tool call marks the turn as escalated', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'tool_use',
          id: 'tool_1',
          name: 'request_human_help',
          input: { reason: 'complaint', details: 'Unhappy with service' },
        },
      ],
    });
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'I have flagged this for our team, they will reach out shortly.' }],
    });

    const db = seedDb();
    const result = await runAgentTurn({
      db,
      businessId: 'biz-A',
      business,
      agentConfig,
      history: [{ role: 'user', content: 'This is unacceptable, I want to speak to someone' }],
      conversationId: 'conv-1',
    });

    expect(result.escalated).toBe(true);
    expect(result.escalationReason).toBe('complaint');
    expect(db.__tables.conversations[0].status).toBe('human_required');
  });

  test('stops after MAX_TOOL_ROUNDS and escalates rather than looping forever', async () => {
    // Always return a tool_use for get_faq, never a final text answer.
    mockCreate.mockResolvedValue({
      content: [{ type: 'tool_use', id: 'loop', name: 'get_faq', input: { question: 'x' } }],
    });

    const db = seedDb();
    const result = await runAgentTurn({
      db,
      businessId: 'biz-A',
      business,
      agentConfig,
      history: [{ role: 'user', content: 'hello' }],
      conversationId: 'conv-1',
    });

    expect(result.escalated).toBe(true);
    expect(mockCreate).toHaveBeenCalledTimes(6); // MAX_TOOL_ROUNDS
  });
});
