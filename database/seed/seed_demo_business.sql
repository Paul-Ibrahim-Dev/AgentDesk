-- =========================================================
-- Demo seed data: "Elite Cuts Minna" (fictional Nigerian barbershop)
--
-- HOW TO USE:
-- 1. Create a real Supabase Auth user for the demo owner first, e.g.
--    via Supabase Studio > Authentication > Add User
--    (email: demo@agentdesk.ng / choose a password), OR sign up through
--    the AgentDesk /register page.
-- 2. Copy that user's UUID from auth.users and replace EVERY occurrence
--    of 'REPLACE-WITH-REAL-AUTH-USER-UUID' below with it (find & replace
--    in your editor, or `sed -i "s/REPLACE-WITH-REAL-AUTH-USER-UUID/<uuid>/" seed_demo_business.sql`).
-- 3. Run this file — either `psql <connection-string> -f seed_demo_business.sql`,
--    or paste it into the Supabase Studio SQL Editor.
--
-- NOTE: this deliberately avoids psql-only features (\set / :'var'
-- substitution). Those don't work reliably inside a dollar-quoted PL/pgSQL
-- block, and Supabase's SQL Editor doesn't support psql meta-commands at
-- all — a plain find-and-replace works in both places.
-- =========================================================

do $$
declare
  v_owner_id uuid := 'REPLACE-WITH-REAL-AUTH-USER-UUID'::uuid;
  v_business_id uuid;
begin
  insert into businesses (
    owner_id, name, description, phone, whatsapp_number, email, address,
    website, social_links, opening_hours, slug
  ) values (
    v_owner_id,
    'Elite Cuts Minna',
    'A modern barbershop in Minna offering precision haircuts, beard grooming and styling for men.',
    '+2348012345678',
    '+2348012345678',
    'hello@elitecutsminna.ng',
    '14 Bosso Road, Minna, Niger State',
    'https://elitecutsminna.ng',
    '{"instagram": "https://instagram.com/elitecutsminna"}'::jsonb,
    '{"mon":"9:00-19:00","tue":"9:00-19:00","wed":"9:00-19:00","thu":"9:00-19:00","fri":"9:00-19:00","sat":"9:00-18:00","sun":"closed"}'::jsonb,
    'elite-cuts-minna'
  )
  returning id into v_business_id;

  insert into business_members (business_id, user_id, role)
  values (v_business_id, v_owner_id, 'owner');

  insert into services (business_id, name, description, price, duration_minutes, booking_enabled, is_available)
  values
    (v_business_id, 'Haircut', 'Classic or fade haircut, washed and styled.', 5000, 30, true, true),
    (v_business_id, 'Beard Trim', 'Beard shaping and line-up with hot towel finish.', 3000, 20, true, true),
    (v_business_id, 'Haircut + Beard', 'Full haircut and beard trim combo.', 7500, 45, true, true);

  insert into faqs (business_id, question, answer)
  values
    (v_business_id, 'What time do you close?', 'We are open Monday–Saturday from 9 AM to 7 PM (6 PM on Saturdays). We are closed on Sundays.'),
    (v_business_id, 'Where are you located?', 'We are at 14 Bosso Road, Minna, Niger State.'),
    (v_business_id, 'Do I need to book in advance?', 'Walk-ins are welcome, but booking ahead on WhatsApp guarantees you a slot.'),
    (v_business_id, 'Do you accept transfers?', 'Yes, we accept cash and bank transfer at the shop.');

  insert into agent_configs (
    business_id, agent_name, greeting, tone, instructions, escalation_message, booking_behaviour, is_published
  ) values (
    v_business_id,
    'Elite Cuts Assistant',
    E'Hi, welcome to Elite Cuts Minna! How can I help you today?',
    'friendly',
    'Be warm, brief and helpful. Only use the business information provided to you. If a customer asks for something outside of what you know (custom pricing negotiation, complaints, or anything not covered by services/FAQs), offer to connect them with the owner.',
    'Let me get Elite Cuts Minna''s team to help you with that directly — they''ll respond here shortly.',
    'collect_then_confirm',
    true
  );
end $$;
