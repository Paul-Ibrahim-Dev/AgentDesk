import { jest } from '@jest/globals';
import { createFakeSupabase } from './fakeSupabase.js';
import { buildToolHandlers } from '../src/services/tools.js';

function seedBusiness(db, businessId, { services = [], faqs = [] } = {}) {
  db.__seed('businesses', [{ id: businessId, name: 'Elite Cuts Minna' }]);
  db.__seed(
    'services',
    services.map((s, i) => ({ id: `svc-${businessId}-${i}`, business_id: businessId, is_available: true, booking_enabled: true, ...s }))
  );
  db.__seed(
    'faqs',
    faqs.map((f, i) => ({ id: `faq-${businessId}-${i}`, business_id: businessId, ...f }))
  );
  db.__seed('bookings', []);
  db.__seed('conversations', []);
  db.__seed('escalations', []);
}

describe('AI tool handlers', () => {
  test('get_services only returns services for the given business (tenant isolation)', async () => {
    const db = createFakeSupabase();
    seedBusiness(db, 'biz-A', { services: [{ name: 'Haircut', price: 5000 }] });
    // Seed a second business's service directly into the same table.
    db.__tables.services.push({ id: 'svc-B-0', business_id: 'biz-B', name: 'Facial', price: 9000, is_available: true });

    const handlers = buildToolHandlers(db, 'biz-A');
    const result = await handlers.get_services();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Haircut');
  });

  test('get_service_details finds a matching service case-insensitively', async () => {
    const db = createFakeSupabase();
    seedBusiness(db, 'biz-A', { services: [{ name: 'Beard Trim', price: 3000, duration_minutes: 20 }] });
    const handlers = buildToolHandlers(db, 'biz-A');

    const result = await handlers.get_service_details({ service_name: 'beard' });
    expect(result.found).toBe(true);
    expect(result.matches[0].name).toBe('Beard Trim');
  });

  test('get_service_details reports not found for an unknown service', async () => {
    const db = createFakeSupabase();
    seedBusiness(db, 'biz-A', { services: [{ name: 'Haircut', price: 5000 }] });
    const handlers = buildToolHandlers(db, 'biz-A');

    const result = await handlers.get_service_details({ service_name: 'Manicure' });
    expect(result.found).toBe(false);
  });

  test('get_faq returns the business FAQs and surfaces keyword matches first', async () => {
    const db = createFakeSupabase();
    seedBusiness(db, 'biz-A', {
      faqs: [
        { question: 'What time do you close?', answer: 'We close at 7pm.' },
        { question: 'Where are you located?', answer: '14 Bosso Road, Minna.' },
      ],
    });
    const handlers = buildToolHandlers(db, 'biz-A');

    const result = await handlers.get_faq({ question: 'what time do you close today' });
    expect(result.matches[0].answer).toBe('We close at 7pm.');
    expect(result.all_faqs).toHaveLength(2);
  });

  test('create_booking fails with a clear error when required fields are missing', async () => {
    const db = createFakeSupabase();
    seedBusiness(db, 'biz-A', { services: [{ name: 'Haircut', price: 5000 }] });
    const handlers = buildToolHandlers(db, 'biz-A');

    const result = await handlers.create_booking({ service_name: 'Haircut', customer_name: 'Musa' });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/customer_phone/);
    expect(result.error).toMatch(/booking_date/);
  });

  test('create_booking fails for a service that does not exist (no hallucinated success)', async () => {
    const db = createFakeSupabase();
    seedBusiness(db, 'biz-A', { services: [{ name: 'Haircut', price: 5000 }] });
    const handlers = buildToolHandlers(db, 'biz-A');

    const result = await handlers.create_booking({
      service_name: 'Manicure',
      customer_name: 'Musa',
      customer_phone: '08010000000',
      booking_date: '2026-09-12',
      booking_time: '10:00 AM',
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/don't have a service/);
  });

  test('create_booking succeeds and persists a real row when all fields are valid', async () => {
    const db = createFakeSupabase();
    seedBusiness(db, 'biz-A', { services: [{ name: 'Haircut', price: 5000, currency: 'NGN' }] });
    const handlers = buildToolHandlers(db, 'biz-A');

    const result = await handlers.create_booking({
      service_name: 'Haircut',
      customer_name: 'Musa Ibrahim',
      customer_phone: '08010000000',
      booking_date: '2026-09-12',
      booking_time: '10:00 AM',
    });

    expect(result.success).toBe(true);
    expect(result.booking.service).toBe('Haircut');
    expect(result.booking.status).toBe('pending');

    // The row must actually exist in the DB, not just in the returned object.
    const stored = db.__tables.bookings.find((b) => b.id === result.booking.id);
    expect(stored).toBeTruthy();
    expect(stored.business_id).toBe('biz-A');
  });

  test('create_booking refuses to book a service with booking disabled', async () => {
    const db = createFakeSupabase();
    seedBusiness(db, 'biz-A', { services: [{ name: 'Consultation', price: 0, booking_enabled: false }] });
    const handlers = buildToolHandlers(db, 'biz-A');

    const result = await handlers.create_booking({
      service_name: 'Consultation',
      customer_name: 'Musa',
      customer_phone: '08010000000',
      booking_date: '2026-09-12',
      booking_time: '10:00 AM',
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not currently bookable/);
  });

  test('get_bookings filters by customer phone', async () => {
    const db = createFakeSupabase();
    seedBusiness(db, 'biz-A', {});
    db.__tables.bookings.push(
      { id: 'b1', business_id: 'biz-A', customer_phone: '111', status: 'pending', created_at: new Date().toISOString() },
      { id: 'b2', business_id: 'biz-A', customer_phone: '222', status: 'pending', created_at: new Date().toISOString() }
    );
    const handlers = buildToolHandlers(db, 'biz-A');

    const result = await handlers.get_bookings({ customer_phone: '111' });
    expect(result.bookings).toHaveLength(1);
    expect(result.bookings[0].id).toBe('b1');
  });

  test('request_human_help marks the conversation as human_required and logs an escalation', async () => {
    const db = createFakeSupabase();
    seedBusiness(db, 'biz-A', {});
    db.__tables.conversations.push({ id: 'conv-1', business_id: 'biz-A', status: 'ai_handling' });
    const handlers = buildToolHandlers(db, 'biz-A');

    const result = await handlers.request_human_help({
      reason: 'complaint',
      details: 'Customer unhappy with last haircut',
      conversation_id: 'conv-1',
    });

    expect(result.escalated).toBe(true);
    expect(result.reason).toBe('complaint');

    const conv = db.__tables.conversations.find((c) => c.id === 'conv-1');
    expect(conv.status).toBe('human_required');
    expect(conv.escalation_reason).toBe('complaint');

    expect(db.__tables.escalations).toHaveLength(1);
    expect(db.__tables.escalations[0].reason).toBe('complaint');
  });

  test('request_human_help falls back to out_of_scope for an invalid reason', async () => {
    const db = createFakeSupabase();
    seedBusiness(db, 'biz-A', {});
    db.__tables.conversations.push({ id: 'conv-1', business_id: 'biz-A', status: 'ai_handling' });
    const handlers = buildToolHandlers(db, 'biz-A');

    const result = await handlers.request_human_help({ reason: 'not-a-real-reason', conversation_id: 'conv-1' });
    expect(result.reason).toBe('out_of_scope');
  });
});
