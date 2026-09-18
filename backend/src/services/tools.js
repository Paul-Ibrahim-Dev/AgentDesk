/**
 * Tool implementations for the AI receptionist.
 *
 * Design principle (see product spec #6/#7/#22): the model is NEVER allowed
 * to state a fact (price, hours, availability) or an outcome (booking
 * created) that didn't come from one of these functions. Every tool here
 * reads/writes real rows through the injected `db` (a Supabase client) and
 * returns plain JSON that gets fed back to Claude as a tool_result.
 *
 * `db` is injected (rather than imported as a singleton) so tests can pass
 * a fake client without touching a real database.
 */

export function buildToolHandlers(db, businessId) {
  return {
    async get_business_info() {
      const { data, error } = await db
        .from('businesses')
        .select('name, description, phone, whatsapp_number, email, address, website, social_links, opening_hours')
        .eq('id', businessId)
        .single();
      if (error) throw error;
      return data;
    },

    async get_services() {
      const { data, error } = await db
        .from('services')
        .select('id, name, description, price, currency, duration_minutes, booking_enabled, is_available')
        .eq('business_id', businessId)
        .eq('is_available', true);
      if (error) throw error;
      return data;
    },

    async get_service_details({ service_name }) {
      if (!service_name) throw new Error('service_name is required');
      const { data, error } = await db
        .from('services')
        .select('id, name, description, price, currency, duration_minutes, booking_enabled, is_available')
        .eq('business_id', businessId)
        .ilike('name', `%${service_name}%`);
      if (error) throw error;
      if (!data || data.length === 0) {
        return { found: false, message: `No service matching "${service_name}" was found.` };
      }
      return { found: true, matches: data };
    },

    async get_faq({ question }) {
      // Simple keyword search across stored FAQs — the model supplies the
      // customer's question (or its own paraphrase), we surface any FAQ
      // rows that plausibly match so the model can ground its answer.
      const { data, error } = await db
        .from('faqs')
        .select('question, answer')
        .eq('business_id', businessId);
      if (error) throw error;

      if (!question) return { faqs: data };

      const q = question.toLowerCase();
      const keywords = q.split(/\W+/).filter((w) => w.length > 3);
      const scored = (data || [])
        .map((faq) => {
          const hay = faq.question.toLowerCase();
          const score = keywords.reduce((acc, kw) => acc + (hay.includes(kw) ? 1 : 0), 0);
          return { faq, score };
        })
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score);

      return {
        matches: scored.length ? scored.map((s) => s.faq) : [],
        all_faqs: data, // always give the model the full list as a fallback
      };
    },

    async create_booking({
      service_name,
      customer_name,
      customer_phone,
      customer_email,
      booking_date,
      booking_time,
      notes,
      conversation_id,
    }) {
      const missing = [];
      if (!service_name) missing.push('service_name');
      if (!customer_name) missing.push('customer_name');
      if (!customer_phone) missing.push('customer_phone');
      if (!booking_date) missing.push('booking_date');
      if (!booking_time) missing.push('booking_time');
      if (missing.length) {
        return { success: false, error: `Missing required booking fields: ${missing.join(', ')}` };
      }

      // Resolve the service by name and confirm booking is actually enabled.
      const { data: services, error: serviceErr } = await db
        .from('services')
        .select('id, name, booking_enabled, is_available, price, currency')
        .eq('business_id', businessId)
        .ilike('name', `%${service_name}%`);
      if (serviceErr) throw serviceErr;

      const service = services?.[0];
      if (!service) {
        return { success: false, error: `We don't have a service called "${service_name}".` };
      }
      if (!service.is_available || !service.booking_enabled) {
        return { success: false, error: `"${service.name}" is not currently bookable.` };
      }

      const { data: booking, error: insertErr } = await db
        .from('bookings')
        .insert({
          business_id: businessId,
          conversation_id: conversation_id || null,
          service_id: service.id,
          customer_name,
          customer_phone,
          customer_email: customer_email || null,
          booking_date,
          booking_time,
          notes: notes || null,
          status: 'pending',
        })
        .select()
        .single();

      if (insertErr) {
        return { success: false, error: 'The booking could not be saved. Please try again.' };
      }

      return {
        success: true,
        booking: {
          id: booking.id,
          service: service.name,
          price: service.price,
          currency: service.currency,
          date: booking.booking_date,
          time: booking.booking_time,
          status: booking.status,
        },
      };
    },

    async get_bookings({ customer_phone }) {
      let query = db
        .from('bookings')
        .select('id, service_id, customer_name, customer_phone, booking_date, booking_time, status, notes, created_at')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (customer_phone) query = query.eq('customer_phone', customer_phone);

      const { data, error } = await query.limit(20);
      if (error) throw error;
      return { bookings: data };
    },

    async request_human_help({ reason, details, conversation_id }) {
      const validReasons = [
        'customer_requested_human',
        'out_of_scope',
        'complaint',
        'special_request',
        'booking_problem',
      ];
      const finalReason = validReasons.includes(reason) ? reason : 'out_of_scope';

      if (conversation_id) {
        await db
          .from('conversations')
          .update({ status: 'human_required', escalation_reason: finalReason })
          .eq('id', conversation_id)
          .eq('business_id', businessId);

        await db.from('escalations').insert({
          business_id: businessId,
          conversation_id,
          reason: finalReason,
          details: details || null,
        });
      }

      return { escalated: true, reason: finalReason };
    },
  };
}

/**
 * Claude tool schemas — the contract the model sees. Keep in sync with
 * buildToolHandlers() above.
 */
export const TOOL_DEFINITIONS = [
  {
    name: 'get_business_info',
    description:
      "Get the business's general info: name, description, contact details, address, website, socials, and opening hours. Use this for questions about location, contact info, or hours.",
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_services',
    description: 'List all currently available services this business offers, with prices and durations.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_service_details',
    description: 'Look up details (price, duration, availability) for one specific service by name.',
    input_schema: {
      type: 'object',
      properties: { service_name: { type: 'string', description: 'Name of the service, e.g. "Haircut"' } },
      required: ['service_name'],
    },
  },
  {
    name: 'get_faq',
    description:
      "Search this business's frequently-asked-questions for anything relevant to the customer's question.",
    input_schema: {
      type: 'object',
      properties: { question: { type: 'string', description: "The customer's question, verbatim or paraphrased" } },
      required: [],
    },
  },
  {
    name: 'create_booking',
    description:
      'Create a real booking once you have collected ALL required details from the customer. Only call this when you actually have every field — never claim a booking succeeded before calling this and receiving success: true.',
    input_schema: {
      type: 'object',
      properties: {
        service_name: { type: 'string' },
        customer_name: { type: 'string' },
        customer_phone: { type: 'string' },
        customer_email: { type: 'string' },
        booking_date: { type: 'string', description: 'YYYY-MM-DD' },
        booking_time: { type: 'string', description: 'e.g. "10:00 AM"' },
        notes: { type: 'string' },
      },
      required: ['service_name', 'customer_name', 'customer_phone', 'booking_date', 'booking_time'],
    },
  },
  {
    name: 'get_bookings',
    description: "Look up a customer's existing bookings, e.g. to check, modify or cancel one.",
    input_schema: {
      type: 'object',
      properties: { customer_phone: { type: 'string' } },
      required: [],
    },
  },
  {
    name: 'request_human_help',
    description:
      'Escalate this conversation to the business owner. Use when the customer explicitly asks for a human, when the question is outside the information you have, for complaints, special requests, or booking problems.',
    input_schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          enum: ['customer_requested_human', 'out_of_scope', 'complaint', 'special_request', 'booking_problem'],
        },
        details: { type: 'string' },
      },
      required: ['reason'],
    },
  },
];
