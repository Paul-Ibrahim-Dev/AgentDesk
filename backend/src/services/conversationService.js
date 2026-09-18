import { supabaseAdmin } from '../lib/supabaseClient.js';
import { runAgentTurn } from './aiAgent.js';

const HISTORY_LIMIT = 20; // last N messages fed to Claude as context

/**
 * Finds an existing open conversation for this external thread, or creates
 * a new one. Tenant isolation is enforced by always scoping on business_id.
 */
export async function findOrCreateConversation({ businessId, channel, externalThreadId, customerName, customerPhone, customerEmail }) {
  const { data: existing, error: findErr } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('business_id', businessId)
    .eq('channel', channel)
    .eq('external_thread_id', externalThreadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findErr) throw findErr;
  if (existing) return existing;

  const { data: created, error: createErr } = await supabaseAdmin
    .from('conversations')
    .insert({
      business_id: businessId,
      channel,
      external_thread_id: externalThreadId,
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      customer_email: customerEmail || null,
      status: 'ai_handling',
    })
    .select()
    .single();

  if (createErr) throw createErr;
  return created;
}

export async function loadRecentMessages(conversationId) {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('sender_type, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(HISTORY_LIMIT);
  if (error) throw error;
  return data;
}

export async function saveMessage({ conversationId, businessId, senderType, content, toolCalls }) {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert({
      conversation_id: conversationId,
      business_id: businessId,
      sender_type: senderType,
      content,
      tool_calls: toolCalls || null,
    })
    .select()
    .single();
  if (error) throw error;

  await supabaseAdmin
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  return data;
}

function toAnthropicRole(senderType) {
  // Both the business owner's manual replies and the AI's replies are
  // presented to the model as "assistant" turns (they're both "the business
  // side" of the conversation from the customer's point of view).
  return senderType === 'customer' ? 'user' : 'assistant';
}

/**
 * Full pipeline for one inbound customer message on any channel:
 * persist it, load the business + agent config, run the AI turn (unless a
 * human has already taken over), persist the reply, and return it so the
 * calling route can push it back out over the right channel.
 */
export async function handleInboundMessage({ businessId, channel, externalThreadId, customerName, customerPhone, customerEmail, text }) {
  const conversation = await findOrCreateConversation({
    businessId,
    channel,
    externalThreadId,
    customerName,
    customerPhone,
    customerEmail,
  });

  await saveMessage({
    conversationId: conversation.id,
    businessId,
    senderType: 'customer',
    content: text,
  });

  // If a human has already taken over, the AI stays silent — the owner
  // replies manually through the dashboard instead.
  if (conversation.status === 'human_handling' || conversation.status === 'human_required') {
    return { conversation, reply: null, handedToHuman: true };
  }

  const [{ data: business, error: bizErr }, { data: agentConfig, error: cfgErr }] = await Promise.all([
    supabaseAdmin.from('businesses').select('*').eq('id', businessId).single(),
    supabaseAdmin.from('agent_configs').select('*').eq('business_id', businessId).maybeSingle(),
  ]);
  if (bizErr) throw bizErr;
  if (cfgErr) throw cfgErr;

  if (!agentConfig || !agentConfig.is_published) {
    // No published agent yet — hand straight to human rather than guessing.
    await supabaseAdmin
      .from('conversations')
      .update({ status: 'human_required', escalation_reason: 'out_of_scope' })
      .eq('id', conversation.id);
    const fallback =
      "Thanks for your message! Our AI assistant isn't set up yet, so a team member will get back to you shortly.";
    await saveMessage({ conversationId: conversation.id, businessId, senderType: 'ai', content: fallback });
    return { conversation, reply: fallback, handedToHuman: true };
  }

  const rawHistory = await loadRecentMessages(conversation.id);
  const history = rawHistory.map((m) => ({ role: toAnthropicRole(m.sender_type), content: m.content }));

  const { reply, toolCalls, escalated, escalationReason } = await runAgentTurn({
    db: supabaseAdmin,
    businessId,
    business,
    agentConfig,
    history,
    conversationId: conversation.id,
  });

  await saveMessage({
    conversationId: conversation.id,
    businessId,
    senderType: 'ai',
    content: reply,
    toolCalls,
  });

  return {
    conversation: { ...conversation, status: escalated ? 'human_required' : conversation.status },
    reply,
    handedToHuman: escalated,
    escalationReason,
  };
}
