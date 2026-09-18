-- =========================================================
-- Row Level Security: a business owner can only ever see
-- rows for businesses they belong to. Service-role key
-- (used by the backend for AI/webhook writes) bypasses RLS
-- by design — the backend is what enforces the customer-facing
-- security boundary for unauthenticated chat traffic.
-- =========================================================

alter table businesses        enable row level security;
alter table business_members  enable row level security;
alter table services          enable row level security;
alter table faqs              enable row level security;
alter table agent_configs     enable row level security;
alter table conversations     enable row level security;
alter table messages          enable row level security;
alter table bookings          enable row level security;
alter table escalations       enable row level security;

-- Helper: is the current auth.uid() a member of this business?
create or replace function is_business_member(target_business_id uuid)
returns boolean as $$
  select exists (
    select 1 from business_members bm
    where bm.business_id = target_business_id
      and bm.user_id = auth.uid()
  );
$$ language sql stable security definer;

-- ---------------------------------------------------------
-- BUSINESSES
-- ---------------------------------------------------------
-- NOTE: also allow owner_id = auth.uid() directly (not just is_business_member).
-- Reason (found via testing against a real Postgres instance): the business
-- creation flow does `.insert({...}).select().single()` to hand the new row
-- straight back to the caller, but at INSERT time no business_members row
-- exists yet — if select visibility depended only on is_business_member(),
-- that immediate SELECT (and therefore the whole insert-with-return call)
-- would be rejected by RLS, even though the same request creates the
-- business_members row microseconds later. Checking owner_id directly closes
-- that chicken-and-egg gap without weakening isolation between tenants.
drop policy if exists businesses_select on businesses;
create policy businesses_select on businesses
  for select using (owner_id = auth.uid() or is_business_member(id));

drop policy if exists businesses_insert on businesses;
create policy businesses_insert on businesses
  for insert with check (owner_id = auth.uid());

drop policy if exists businesses_update on businesses;
create policy businesses_update on businesses
  for update using (is_business_member(id));

drop policy if exists businesses_delete on businesses;
create policy businesses_delete on businesses
  for delete using (owner_id = auth.uid());

-- ---------------------------------------------------------
-- BUSINESS MEMBERS
-- ---------------------------------------------------------
drop policy if exists business_members_select on business_members;
create policy business_members_select on business_members
  for select using (is_business_member(business_id));

drop policy if exists business_members_insert on business_members;
create policy business_members_insert on business_members
  for insert with check (
    user_id = auth.uid()
    or exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid())
  );

-- ---------------------------------------------------------
-- Generic per-tenant policy generator for the remaining tables
-- (services, faqs, agent_configs, conversations, messages, bookings, escalations)
-- All of them carry a business_id column.
-- ---------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['services','faqs','agent_configs','conversations','messages','bookings','escalations']
  loop
    execute format('drop policy if exists %I_tenant_select on %I;', t, t);
    execute format(
      'create policy %I_tenant_select on %I for select using (is_business_member(business_id));',
      t, t
    );

    execute format('drop policy if exists %I_tenant_insert on %I;', t, t);
    execute format(
      'create policy %I_tenant_insert on %I for insert with check (is_business_member(business_id));',
      t, t
    );

    execute format('drop policy if exists %I_tenant_update on %I;', t, t);
    execute format(
      'create policy %I_tenant_update on %I for update using (is_business_member(business_id));',
      t, t
    );

    execute format('drop policy if exists %I_tenant_delete on %I;', t, t);
    execute format(
      'create policy %I_tenant_delete on %I for delete using (is_business_member(business_id));',
      t, t
    );
  end loop;
end $$;

-- NOTE on customer-facing chat:
-- Customers never hold a Supabase auth session, so anonymous chat traffic
-- is written by the backend using the SERVICE ROLE key inside
-- backend/src/services/*, never from the browser. The backend is
-- responsible for stamping the correct business_id on every row it writes,
-- which is what actually prevents cross-tenant leakage for that path.
-- RLS above protects the dashboard's direct-to-Supabase reads/writes
-- (if the frontend ever queries Supabase directly with a user's session).
