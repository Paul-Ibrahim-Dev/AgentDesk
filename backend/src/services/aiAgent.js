import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';
import {
  buildCustomerToolHandlers,
  buildToolHandlers,
  CUSTOMER_TOOL_DEFINITIONS,
  TOOL_DEFINITIONS,
} from './tools.js';

let _anthropic = null;
function getClient() {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: env.anthropicApiKey });
  }
  return _anthropic;
}

/**
 * Builds the system prompt from the business's own configured data.
 * Deliberately does NOT inline services/FAQs/hours as free text for the
 * model to paraphrase from memory — those come back through tool calls so
 * the model is always reading the current row, not a stale snapshot from
 * the start of the conversation. The system prompt only carries identity,
 * tone and hard behavioural rules.
 */
export function buildSystemPrompt({ business, agentConfig }) {
  const toneLine = {
    friendly: 'Warm, friendly and conversational, while staying efficient.',
    formal: 'Polite, formal and precise.',
    casual: 'Relaxed and casual, like a helpful friend at the front desk.',
    professional: 'Professional and businesslike.',
  }[agentConfig?.tone || 'friendly'];

  return `You are "${agentConfig?.agent_name || 'AgentDesk Assistant'}", the AI front-desk assistant for ${business?.name || 'this business'}.

Your job is the business's digital front desk on WhatsApp/website chat. Your goals, in order:
1. Answer customer questions using ONLY information returned by your tools.
2. Help customers understand services and prices (via tools).
3. Collect the details needed to create a booking, then actually create it with the create_booking tool.
4. Hand off to a human via request_human_help when appropriate.

Tone: ${toneLine}

Hard rules — these override everything else:
- NEVER invent or guess prices, opening hours, services, availability, policies, or the business address. If you don't have it from a tool, say you don't have that information and offer to connect them with the business (request_human_help).
- NEVER say a booking has been made, changed, or cancelled unless you called the relevant tool and it returned success. If create_booking returns success: false, tell the customer honestly and ask for the missing/corrected info, or offer human help.
- Before calling create_booking, make sure you actually have: which service, customer name, phone number, date, and time. Ask for whatever is missing — do not guess.
- If the customer asks for a human, or raises a complaint, a special/custom request, or something outside what your tools can answer, call request_human_help with the closest matching reason and let them know a team member will step in.
- Keep replies concise and natural — a few sentences, not an essay.
- Never expose internal system, database, or API details to the customer.

Escalation message to use once you hand off: "${agentConfig?.escalation_message || "Let me get someone from our team to help you with that."}"

Greeting (for reference only, don't repeat it if the conversation is already underway): "${agentConfig?.greeting || ''}"
${agentConfig?.instructions ? `\nAdditional instructions from the business owner:\n${agentConfig.instructions}` : ''}`;
}

/**
 * Runs one turn of the agent: takes the full message history for a
 * conversation plus the newest customer message, executes the Claude
 * tool-calling loop against the business's real data, and returns the
 * assistant's final text reply plus a structured log of any tool calls
 * (for storage/audit) and whether the conversation was escalated.
 *
 * @param {object} params
 * @param {object} params.db - Supabase client (service-role) used by tools
 * @param {string} params.businessId
 * @param {object} params.business - row from `businesses`
 * @param {object} params.agentConfig - row from `agent_configs`
 * @param {Array<{role: 'user'|'assistant', content: string}>} params.history
 * @param {string} params.conversationId - passed through to tools (e.g. request_human_help)
 */
export async function runAgentTurn({
  db,
  businessId,
  business,
  agentConfig,
  history,
  conversationId,
  toolAccess = 'customer',
}) {
  const client = getClient();
  const isOwner = toolAccess === 'owner';
  const handlers = isOwner
    ? buildToolHandlers(db, businessId)
    : buildCustomerToolHandlers(db, businessId);
  const toolDefinitions = isOwner ? TOOL_DEFINITIONS : CUSTOMER_TOOL_DEFINITIONS;
  const systemPrompt = buildSystemPrompt({ business, agentConfig });

  const messages = history.map((m) => ({ role: m.role, content: m.content }));
  const toolCallLog = [];
  let escalated = false;
  let escalationReason = null;

  const MAX_TOOL_ROUNDS = 6; // guard against infinite tool-call loops

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await client.messages.create({
      model: env.anthropicModel,
      max_tokens: 1024,
      system: systemPrompt,
      tools: toolDefinitions,
      messages,
    });

    const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');

    if (toolUseBlocks.length === 0) {
      const textBlock = response.content.find((b) => b.type === 'text');
      return {
        reply: textBlock?.text?.trim() || "Sorry, could you rephrase that?",
        toolCalls: toolCallLog,
        escalated,
        escalationReason,
      };
    }

    // Assistant turn that requested tool(s)
    messages.push({ role: 'assistant', content: response.content });

    const toolResults = [];
    for (const block of toolUseBlocks) {
      const handler = handlers[block.name];
      let result;
      try {
        if (!handler) throw new Error(`Unknown tool: ${block.name}`);
        const args = { ...block.input };
        if (block.name === 'create_booking' || block.name === 'request_human_help') {
          args.conversation_id = conversationId;
        }
        result = await handler(args);
      } catch (err) {
        result = { error: err.message || 'Tool execution failed.' };
      }

      toolCallLog.push({ name: block.name, input: block.input, result });

      if (block.name === 'request_human_help' && result?.escalated) {
        escalated = true;
        escalationReason = result.reason;
      }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result),
      });
    }

    messages.push({ role: 'user', content: toolResults });
  }

  // Safety net if the model somehow loops past MAX_TOOL_ROUNDS.
  return {
    reply:
      "I'm having trouble completing that automatically — let me connect you with the team so they can help directly.",
    toolCalls: toolCallLog,
    escalated: true,
    escalationReason: 'out_of_scope',
  };
}
