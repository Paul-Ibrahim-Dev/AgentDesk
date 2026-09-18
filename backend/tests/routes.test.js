import { jest } from '@jest/globals';
import request from 'supertest';
import { createFakeSupabase } from './fakeSupabase.js';

/**
 * HTTP-level tests for the Express routes: auth enforcement, multi-tenant
 * isolation, and request validation. These complement the lower-level
 * tests in tools.test.js / aiAgent.test.js / conversationService.test.js,
 * which already cover the AI/tool/conversation business logic directly.
 *
 * Registration/login themselves are delegated entirely to Supabase Auth
 * (the frontend talks to Supabase directly with the anon key — see
 * frontend/src/lib/supabaseClient.js and AuthContext.jsx). There is no
 * backend "register"/"login" route to unit test; what the backend DOES
 * own is verifying the resulting session token on every request, which is
 * what `requireAuth` below tests via a fake `auth.getUser`.
 */

const fakeDb = createFakeSupabase();

// Two fake "logged in" users, keyed by bearer token, standing in for real
// Supabase Auth sessions.
const USERS = {
  'token-owner-a': { id: 'user-A', email: 'ownera@example.ng' },
  'token-owner-b': { id: 'user-B', email: 'ownerb@example.ng' },
};

jest.unstable_mockModule('../src/lib/supabaseClient.js', () => ({
  supabaseAdmin: {
    ...fakeDb,
    auth: {
      async getUser(token) {
        const user = USERS[token];
        if (!user) return { data: null, error: new Error('invalid token') };
        return { data: { user }, error: null };
      },
    },
  },
  // RLS itself is exercised separately against real Postgres (see
  // database/migrations) — here `supabaseForUser` just reuses the same
  // fake table store so route logic can be tested without a live DB.
  supabaseForUser: () => fakeDb,
}));

jest.unstable_mockModule('@anthropic-ai/sdk', () => ({
  default: class Anthropic {
    constructor() {
      this.messages = { create: jest.fn() };
    }
  },
}));

const { createApp } = await import('../src/index.js');
const app = createApp();

function seedFresh() {
  fakeDb.__tables.businesses = [];
  fakeDb.__tables.business_members = [];
  fakeDb.__tables.services = [];
  fakeDb.__tables.faqs = [];
  fakeDb.__tables.agent_configs = [];
  fakeDb.__tables.bookings = [];
  fakeDb.__tables.conversations = [];
  fakeDb.__tables.messages = [];
  fakeDb.__tables.escalations = [];
}

beforeEach(() => {
  seedFresh();
});

describe('auth enforcement', () => {
  test('rejects requests with no bearer token', async () => {
    const res = await request(app).get('/api/businesses');
    expect(res.status).toBe(401);
  });

  test('rejects requests with an invalid/expired token', async () => {
    const res = await request(app).get('/api/businesses').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});

describe('business creation', () => {
  test('creates a business, membership row, and default agent config', async () => {
    const res = await request(app)
      .post('/api/businesses')
      .set('Authorization', 'Bearer token-owner-a')
      .send({ name: 'Elite Cuts Minna', phone: '+2348012345678' });

    expect(res.status).toBe(201);
    expect(res.body.business.name).toBe('Elite Cuts Minna');
    expect(res.body.business.owner_id).toBe('user-A');

    const membership = fakeDb.__tables.business_members.find((m) => m.business_id === res.body.business.id);
    expect(membership).toBeTruthy();
    expect(membership.role).toBe('owner');

    const config = fakeDb.__tables.agent_configs.find((c) => c.business_id === res.body.business.id);
    expect(config).toBeTruthy();
    expect(config.greeting).toMatch(/Elite Cuts Minna/);
  });

  test('rejects a business with no name', async () => {
    const res = await request(app)
      .post('/api/businesses')
      .set('Authorization', 'Bearer token-owner-a')
      .send({ phone: '+2348012345678' });
    expect(res.status).toBe(400);
  });
});

describe('multi-tenant isolation', () => {
  async function createBusinessAsOwnerA() {
    const res = await request(app)
      .post('/api/businesses')
      .set('Authorization', 'Bearer token-owner-a')
      .send({ name: 'Elite Cuts Minna' });
    return res.body.business;
  }

  test("owner B cannot read owner A's business", async () => {
    const business = await createBusinessAsOwnerA();

    const asOwnerA = await request(app)
      .get(`/api/businesses/${business.id}`)
      .set('Authorization', 'Bearer token-owner-a');
    expect(asOwnerA.status).toBe(200);

    const asOwnerB = await request(app)
      .get(`/api/businesses/${business.id}`)
      .set('Authorization', 'Bearer token-owner-b');
    expect(asOwnerB.status).toBe(403);
  });

  test("owner B cannot list or create services under owner A's business", async () => {
    const business = await createBusinessAsOwnerA();

    const listAsB = await request(app)
      .get(`/api/businesses/${business.id}/services`)
      .set('Authorization', 'Bearer token-owner-b');
    expect(listAsB.status).toBe(403);

    const createAsB = await request(app)
      .post(`/api/businesses/${business.id}/services`)
      .set('Authorization', 'Bearer token-owner-b')
      .send({ name: 'Sneaky Service', price: 1000 });
    expect(createAsB.status).toBe(403);
    expect(fakeDb.__tables.services).toHaveLength(0);
  });

  test("owner B cannot view owner A's bookings or conversations", async () => {
    const business = await createBusinessAsOwnerA();
    fakeDb.__tables.bookings.push({
      id: 'bk-1',
      business_id: business.id,
      customer_name: 'Musa',
      booking_date: '2026-09-20',
      booking_time: '10:00 AM',
      status: 'pending',
    });

    const res = await request(app)
      .get(`/api/businesses/${business.id}/bookings`)
      .set('Authorization', 'Bearer token-owner-b');
    expect(res.status).toBe(403);
  });
});

describe('services validation', () => {
  async function createBusiness() {
    const res = await request(app)
      .post('/api/businesses')
      .set('Authorization', 'Bearer token-owner-a')
      .send({ name: 'Elite Cuts Minna' });
    return res.body.business;
  }

  test('rejects a service with no name', async () => {
    const business = await createBusiness();
    const res = await request(app)
      .post(`/api/businesses/${business.id}/services`)
      .set('Authorization', 'Bearer token-owner-a')
      .send({ price: 5000 });
    expect(res.status).toBe(400);
  });

  test('rejects a negative price', async () => {
    const business = await createBusiness();
    const res = await request(app)
      .post(`/api/businesses/${business.id}/services`)
      .set('Authorization', 'Bearer token-owner-a')
      .send({ name: 'Haircut', price: -500 });
    expect(res.status).toBe(400);
  });

  test('creates a valid service', async () => {
    const business = await createBusiness();
    const res = await request(app)
      .post(`/api/businesses/${business.id}/services`)
      .set('Authorization', 'Bearer token-owner-a')
      .send({ name: 'Haircut', price: 5000, duration_minutes: 30 });
    expect(res.status).toBe(201);
    expect(res.body.service.name).toBe('Haircut');
  });
});

describe('FAQ validation', () => {
  test('rejects a FAQ missing question or answer', async () => {
    const bizRes = await request(app)
      .post('/api/businesses')
      .set('Authorization', 'Bearer token-owner-a')
      .send({ name: 'Elite Cuts Minna' });
    const business = bizRes.body.business;

    const res = await request(app)
      .post(`/api/businesses/${business.id}/faqs`)
      .set('Authorization', 'Bearer token-owner-a')
      .send({ question: 'What time do you close?' }); // missing answer
    expect(res.status).toBe(400);
  });
});

describe('booking status validation', () => {
  test('rejects an invalid booking status transition', async () => {
    const bizRes = await request(app)
      .post('/api/businesses')
      .set('Authorization', 'Bearer token-owner-a')
      .send({ name: 'Elite Cuts Minna' });
    const business = bizRes.body.business;

    fakeDb.__tables.bookings.push({
      id: 'bk-1',
      business_id: business.id,
      customer_name: 'Musa',
      booking_date: '2026-09-20',
      booking_time: '10:00 AM',
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/businesses/${business.id}/bookings/bk-1`)
      .set('Authorization', 'Bearer token-owner-a')
      .send({ status: 'not-a-real-status' });
    expect(res.status).toBe(400);
  });

  test('confirms a pending booking', async () => {
    const bizRes = await request(app)
      .post('/api/businesses')
      .set('Authorization', 'Bearer token-owner-a')
      .send({ name: 'Elite Cuts Minna' });
    const business = bizRes.body.business;

    fakeDb.__tables.bookings.push({
      id: 'bk-2',
      business_id: business.id,
      customer_name: 'Musa',
      booking_date: '2026-09-20',
      booking_time: '10:00 AM',
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/businesses/${business.id}/bookings/bk-2`)
      .set('Authorization', 'Bearer token-owner-a')
      .send({ status: 'confirmed' });
    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('confirmed');
  });
});
