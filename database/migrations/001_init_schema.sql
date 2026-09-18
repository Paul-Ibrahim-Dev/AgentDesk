-- =========================================================
-- AgentDesk core schema
-- Multi-tenant: every business-scoped table carries business_id
-- Run against a Supabase Postgres project (has `auth.users` already).
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- BUSINESSES
-- ---------------------------------------------------------
create table if not exists businesses (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  phone text,
  whatsapp_number text,
  email text,
  address text,
  website text,
  social_links jsonb default '{}'::jsonb,
  opening_hours jsonb default '{}'::jsonb, -- {"mon":"9:00-18:00", ...}
  slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- BUSINESS MEMBERS (owner today, room for staff logins later)
-- ---------------------------------------------------------
create table if not exists business_members (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','staff')),
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

-- ---------------------------------------------------------
-- SERVICES
-- ---------------------------------------------------------
create table if not exists services (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  description text,
  price numeric(12,2),
  currency text not null default 'NGN',
  duration_minutes integer,
  booking_enabled boolean not null default true,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- FAQS
-- ---------------------------------------------------------
create table if not exists faqs (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  question text not null,
  answer text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- AGENT CONFIG (one per business)
-- ---------------------------------------------------------
create table if not exists agent_configs (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null unique references businesses(id) on delete cascade,
  agent_name text not null default 'AgentDesk Assistant',
  greeting text not null default 'Hi! How can I help you today?',
  tone text not null default 'friendly' check (tone in ('friendly','formal','casual','professional')),
  instructions text,
  escalation_message text not null default 'Let me get one of our team members to help you with that.',
  booking_behaviour text default 'collect_then_confirm',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- CONVERSATIONS
-- ---------------------------------------------------------
create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  customer_name text,
  customer_phone text,
  customer_email text,
  channel text not null default 'web' check (channel in ('web','whatsapp')),
  external_thread_id text, -- e.g. WhatsApp wa_id, used to resume conversations
  status text not null default 'ai_handling'
    check (status in ('ai_handling','human_required','human_handling','resolved')),
  escalation_reason text,
  last_message_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_conversations_business on conversations(business_id);
create index if not exists idx_conversations_external_thread on conversations(business_id, external_thread_id);

-- ---------------------------------------------------------
-- MESSAGES
-- ---------------------------------------------------------
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  sender_type text not null check (sender_type in ('customer','ai','owner')),
  content text not null,
  tool_calls jsonb, -- record of any tool/function calls made while generating this message
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_conversation on messages(conversation_id);

-- ---------------------------------------------------------
-- BOOKINGS
-- ---------------------------------------------------------
create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  booking_date date not null,
  booking_time text not null,
  status text not null default 'pending'
    check (status in ('pending','confirmed','cancelled','completed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bookings_business on bookings(business_id);

-- ---------------------------------------------------------
-- ESCALATIONS
-- ---------------------------------------------------------
create table if not exists escalations (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  reason text not null, -- 'customer_requested_human' | 'out_of_scope' | 'complaint' | 'special_request' | 'booking_problem'
  details text,
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_escalations_business on escalations(business_id);

-- ---------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array['businesses','services','faqs','agent_configs','conversations','bookings']
  loop
    execute format('drop trigger if exists trg_set_updated_at on %I;', t);
    execute format('create trigger trg_set_updated_at before update on %I for each row execute function set_updated_at();', t);
  end loop;
end $$;
