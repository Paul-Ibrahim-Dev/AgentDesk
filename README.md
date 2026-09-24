# AgentDesk — AI Front-Desk Agents for Nigerian SMEs

**Never miss a customer again.**

AgentDesk is a done-for-you AI receptionist for small Nigerian businesses. A business
owner configures their services, prices, hours, FAQs and booking rules, and gets an AI
agent that answers customer questions on WhatsApp/web chat, captures bookings, and hands
anything it can't handle straight to the owner.

This repo contains a working MVP: a real Express + Supabase backend with a proper
tool-calling Claude agent, and a React dashboard + public site on top of it.

---

## 1. Is this actually working, or a mockup?

It's a real, working application — not a UI mockup. Specifically, in this environment:

- **38 backend tests pass**, including a full end-to-end scripted conversation against
  the exact seeded demo business ("Elite Cuts Minna") that walks through: asking about
  services, asking a price, making a real booking, and escalating to a human — using the
  real `conversationService` → `aiAgent` → `tools` pipeline the production app runs.
- **The database schema and Row Level Security policies were verified against a real
  PostgreSQL instance** (not just read for syntax) — see [§7](#7-what-was-actually-verified-here-vs-what-you-still-need-to-check).
  This caught and fixed a real RLS bug (see below).
- **The frontend builds cleanly** (`vite build`) and **5 component tests pass** rendering
  real pages (Home, Pricing, Login/Register, route protection) with React Testing Library.

What it *can't* do inside this sandbox is talk to a live Supabase project or a live
Claude API — those require credentials only you can provide (see [§7](#7-what-was-actually-verified-here-vs-what-you-still-need-to-check)
for exactly what that means for you).

---

## 2. Architecture

```
/backend                 Express API (Node 18+, ESM)
  src/routes/             REST endpoints — business, services, faqs, agent-config,
                           bookings, conversations, chat (public), webhooks/whatsapp
  src/services/           aiAgent.js (Claude tool-calling loop), tools.js (the actual
                           tool implementations), conversationService.js (message/
                           conversation persistence + orchestration)
  src/messaging/          MessageProvider interface + WebMessageProvider (used by the
                           demo/dashboard chat today) + WhatsAppMessageProvider (stub,
                           see §5)
  src/middleware/         requireAuth (verifies Supabase session tokens),
                           requireBusinessMembership (multi-tenant guard), error handler
  src/lib/supabaseClient.js   supabaseAdmin (service-role, server-only) and
                               supabaseForUser (per-request, RLS-respecting) clients
  tests/                  Jest + Supertest — 38 tests across 5 files

/frontend                React 19 + Vite + Tailwind
  src/pages/               Public site: Home, HowItWorks, Pricing, FAQ, Contact, Demo,
                            Login, Register
  src/pages/dashboard/     Overview, BusinessProfile, Services, Faqs, AgentConfig,
                            Bookings, Conversations, ConversationDetail, NewBusiness
  src/context/             AuthContext (wraps Supabase Auth), BusinessContext (which
                            business is active)
  src/lib/                 supabaseClient.js (browser, anon key only), apiClient.js
                            (attaches the Supabase session token to backend calls)
  src/tests/               Vitest + Testing Library — 5 tests

/database
  migrations/001_init_schema.sql       Full schema: users -> businesses -> business_members,
                                        services, faqs, agent_configs, conversations,
                                        messages, bookings, escalations
  migrations/002_row_level_security.sql  RLS policies enforcing multi-tenant isolation
  seed/seed_demo_business.sql          "Elite Cuts Minna" demo business seed
```

**Data flow:** business owner → creates business profile → configures AI receptionist →
customer messages on WhatsApp/web → `handleInboundMessage` finds/creates the
conversation → `runAgentTurn` calls Claude with tool definitions → Claude calls tools
(`get_services`, `get_faq`, `create_booking`, `request_human_help`, etc.) which read/write
**real rows** → the reply is only ever built from what those tools actually returned →
booking appears in the dashboard → owner can take over or reply manually at any point.

---

## 3. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is fine) — for Postgres, Auth,
  and Row Level Security
- An [Anthropic API key](https://console.anthropic.com) for Claude
- (Optional, for later) a WhatsApp Business API / Meta developer account

---

## 4. Setup

### 4.1 Create your Supabase project and run the migrations

1. Create a new project at [supabase.com](https://supabase.com).
2. In the Supabase Studio **SQL Editor**, run, in order:
   - `database/migrations/001_init_schema.sql`
   - `database/migrations/002_row_level_security.sql`
3. Grab your project's URL and keys from **Project Settings → API**:
   - `Project URL` → `SUPABASE_URL`
   - `anon` `public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**server-only — never put this in
     the frontend**)

### 4.2 Backend

```bash
cd backend
cp .env.example .env
# edit .env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
npm install
npm test        # 38 tests, no external services required — everything is mocked
npm run dev      # starts on http://localhost:4000
```

### 4.3 Frontend

```bash
cd frontend
cp .env.example .env
# edit .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (same project as the backend),
# VITE_API_BASE_URL=http://localhost:4000
npm install
npm test         # 5 tests, jsdom-based, no live services required
npm run dev      # starts on http://localhost:5173
```

Open `http://localhost:5173`, click **Get Started**, register, then create your first
business — you'll land straight in the onboarding flow.

### 4.4 Seed the demo business (optional but recommended)

The demo ("Elite Cuts Minna") is what powers the public `/demo` page.

1. Create a Supabase Auth user for the demo owner (Studio → Authentication → Add User,
   e.g. `demo@agentdesk.ng`), or just register one through the app.
2. Copy that user's UUID (Studio → Authentication → Users).
3. In `database/seed/seed_demo_business.sql`, replace every occurrence of
   `REPLACE-WITH-REAL-AUTH-USER-UUID` with that UUID.
4. Run the file in the Supabase SQL Editor (or `psql <connection-string> -f seed/seed_demo_business.sql`).
5. Copy the created business's `id` (`select id from businesses where slug =
   'elite-cuts-minna';`) into `frontend/.env` as `VITE_DEMO_BUSINESS_ID`.

> **Note:** an earlier version of this seed file used psql's `\set`/`:'var'`
> variable substitution inside a `do $$ ... $$` block. That doesn't reliably work in
> psql (confirmed by actually running it against Postgres 16 in this environment — it
> throws a syntax error), and Supabase's SQL Editor doesn't support psql
> meta-commands at all. The current version uses a plain placeholder string instead,
> which works in both.

### 4.5 Deployment

- **Backend (Render):** the repo-root render.yaml defines the agentdesk-backend
  web service. In Render, create a Blueprint from this repository and keep the
  repository root as the Blueprint path. Render builds from backend/ with npm ci,
  starts with npm start, and checks /health. Supply SUPABASE_URL,
  SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, and ANTHROPIC_API_KEY when
  prompted. Set CORS_ORIGIN to the deployed frontend origin (for example,
  https://your-app.vercel.app). Keep every secret in Render's environment settings;
  never commit real keys.
- **Frontend:** deploy frontend/ as a Vite SPA on Vercel. Set the browser-safe
  VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, and set VITE_API_BASE_URL to
  the Render service URL.
- **Railway or another host:** configure the runtime to use backend/ as the service
  root, npm ci as the build command, and npm start as the start command. Set the
  backend variables listed in backend/.env.example in the host's environment
  settings. Never commit real keys.
---

## 5. WhatsApp integration status

WhatsApp is **designed for, not wired up to a live number yet** — and that's
deliberate, per the "do not fake a production WhatsApp integration" instruction this
was built against.

- `backend/src/messaging/MessageProvider.js` defines the interface
  (`sendMessage` / `receiveMessage` / `handleWebhook`).
- `WebMessageProvider` implements it today and is what the dashboard/demo chat actually
  uses.
- `WhatsAppMessageProvider` implements the same interface against the WhatsApp Cloud
  API's `sendMessage` and webhook-verification shape, but **has never been run against a
  real WhatsApp Business Account** in this environment (no such account exists in this
  sandbox, and Meta's Graph API isn't reachable from it). Treat it as a well-typed
  starting point, not a tested integration. `backend/src/routes/webhooks/whatsapp.js`
  is where Meta's webhook would be pointed once you have real credentials.
- Switching over is meant to be a config change (`MESSAGING_PROVIDER=whatsapp` +
  the `WHATSAPP_*` env vars), not a rewrite of the AI/conversation logic — because that
  logic never talks to the provider directly, only through the `MessageProvider`
  interface.

---

## 6. AI safety behaviour (and how it's enforced, not just promised)

The system prompt built in `aiAgent.js` explicitly forbids inventing prices, hours,
services, availability, or claiming a booking succeeded. This isn't just a prompt
instruction taken on faith — it's structurally enforced:

- Prices, hours, services and FAQs are only ever available to the model **through tool
  calls** that hit the real `services`/`faqs`/`businesses` tables — there's no
  business data embedded in the prompt for the model to paraphrase or misremember.
- `create_booking` only returns `success: true` after a real row is inserted;
  `tests/aiAgent.test.js` specifically asserts the model **cannot** claim a booking
  succeeded when the tool reports failure (e.g. booking a service the business doesn't
  offer).
- Escalation (`request_human_help`) writes a real `escalations` row and flips the
  conversation's status — a human owner will actually see it in the dashboard, not just
  a message claiming they will.

---

## 7. What was actually verified here vs. what you still need to check

This project was built and checked inside a sandboxed environment with no access to
supabase.co or the Claude API. Being upfront about the line between the two:

**Verified in this environment:**
- Backend: 38 Jest/Supertest tests, including auth enforcement, cross-tenant isolation
  at the HTTP layer, service/FAQ/booking validation, and the full demo conversation
  script, all passing.
- Frontend: builds cleanly with `vite build`; 5 Vitest/RTL tests render real pages and
  pass.
- Database schema + RLS: applied to a real local PostgreSQL 16 instance (not just
  read for syntax). This is how two real bugs were caught and fixed before you'd have
  hit them:
  1. **RLS chicken-and-egg on business creation** — `businesses_select` originally only
     checked `is_business_member(id)`, which doesn't exist yet at the moment a business
     is first inserted and immediately selected back. Fixed by also allowing
     `owner_id = auth.uid()`. Verified cross-tenant isolation still holds after the fix.
  2. **Seed script used psql-only syntax that doesn't work in a `do $$...$$` block**
     (see §4.4) — replaced with a portable placeholder approach.

**Not verified here — needs your real credentials:**
- A live conversation against the actual Claude API (only mocked responses were used;
  the mocks match the SDK's real response shape, but a live call could surface prompt
  or tool-schema issues the mocks wouldn't).
- Supabase Auth's actual behaviour (email confirmation flow, session refresh) — the
  frontend's `AuthContext` calls the real `@supabase/supabase-js` methods, but nothing
  in this sandbox could reach a live Supabase Auth server to confirm the full
  register → confirm → login loop end to end.
- The WhatsApp provider (see §5).
- Real deployment to Vercel/Render/Railway.

Please run through the [Definition of Done checklist](#8-definition-of-done-checklist)
yourself once you have a real Supabase project and Anthropic key — everything is built
to make that a "run the app and click through it" exercise, not further development.

---

## 8. Definition of done checklist

Once you have real Supabase + Anthropic credentials configured:

- [ ] Register an AgentDesk account
- [ ] Create a business
- [ ] Add services
- [ ] Add FAQs
- [ ] Configure the AI receptionist (and try the live preview)
- [ ] Open the customer chat (via `/demo` or your own business's chat)
- [ ] Ask questions about the business → get answers based on your real data
- [ ] Make a booking through the AI
- [ ] See that booking in the dashboard
- [ ] View the conversation
- [ ] Escalate to a human ("I want to speak with someone")
- [ ] Reply manually as the owner from the Conversations tab
- [ ] Log out and back in
- [ ] Create a second account/business and confirm you cannot see the first one's data

---

## 9. Testing

```bash
# Backend — 38 tests, ~1s, no external services needed
cd backend && npm test

# Frontend — 5 tests, jsdom-based, no external services needed
cd frontend && npm test
```

What's covered: user auth enforcement (401/403), business creation + tenant isolation,
service/FAQ/booking validation, the AI tool-calling loop (including the "never claim a
failed booking succeeded" and "stop looping and escalate" safety nets), conversation
persistence and escalation, and the full demo business conversation script end to end.

---

## 10. Environment variables

See `backend/.env.example` and `frontend/.env.example` for the full list. Every secret
is read from the environment — nothing is hardcoded, and the service-role Supabase key
and Anthropic key never reach the frontend bundle (only `VITE_*`-prefixed variables are
exposed to the browser by Vite, and neither of those keys is one of them).
