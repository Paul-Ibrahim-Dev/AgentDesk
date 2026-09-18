import { MessageProvider } from './MessageProvider.js';
import { env } from '../config/env.js';

const GRAPH_API_BASE = 'https://graph.facebook.com/v20.0';

/**
 * WhatsAppMessageProvider
 * -----------------------
 * Real implementation of the WhatsApp Cloud API (Meta), following the
 * MessageProvider interface. This is written to the actual Graph API
 * contract so it will work once a real WHATSAPP_ACCESS_TOKEN,
 * WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_VERIFY_TOKEN are configured and the
 * webhook URL is registered in the Meta App dashboard.
 *
 * IMPORTANT (honesty note): this has not been exercised against a live
 * WhatsApp Business Account in this project, because no such account/
 * credentials exist here. Treat it as "implemented against the documented
 * API contract, pending a real-credential smoke test" rather than
 * "verified in production." Swap MESSAGING_PROVIDER=whatsapp once you have
 * real credentials and test with Meta's test number first.
 */
export class WhatsAppMessageProvider extends MessageProvider {
  constructor() {
    super();
    this.accessToken = env.whatsappAccessToken;
    this.phoneNumberId = env.whatsappPhoneNumberId;
    this.verifyToken = env.whatsappVerifyToken;
  }

  async sendMessage({ externalThreadId, text }) {
    if (!this.accessToken || !this.phoneNumberId) {
      throw new Error(
        'WhatsApp is not configured (missing WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID).'
      );
    }

    const res = await fetch(`${GRAPH_API_BASE}/${this.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: externalThreadId, // WhatsApp uses the customer's phone number (wa_id) as the thread id
        type: 'text',
        text: { body: text },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`WhatsApp send failed (${res.status}): ${errBody}`);
    }
    return res.json();
  }

  /**
   * Parses a WhatsApp Cloud API webhook payload into InboundMessage[].
   * See: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
   */
  receiveMessage(rawPayload, businessId) {
    const messages = [];
    const entries = rawPayload?.entry || [];

    for (const entry of entries) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        for (const msg of value.messages || []) {
          if (msg.type !== 'text') continue; // MVP: text only
          const contact = (value.contacts || []).find((c) => c.wa_id === msg.from);
          messages.push({
            businessId,
            channel: 'whatsapp',
            externalThreadId: msg.from,
            customerName: contact?.profile?.name,
            customerPhone: msg.from,
            text: msg.text?.body || '',
          });
        }
      }
    }
    return messages;
  }

  /**
   * Express handler: supports Meta's webhook verification (GET) and
   * inbound message delivery (POST). The route wiring passes businessId
   * via the URL, since each business gets its own webhook path.
   */
  async handleWebhook(req, res, { businessId, onInboundMessages }) {
    if (req.method === 'GET') {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      if (mode === 'subscribe' && token === this.verifyToken) {
        return res.status(200).send(challenge);
      }
      return res.status(403).send('Verification failed.');
    }

    // POST: inbound message delivery
    const inbound = this.receiveMessage(req.body, businessId);
    if (inbound.length && onInboundMessages) {
      await onInboundMessages(inbound);
    }
    // WhatsApp requires a fast 200 OK regardless of processing outcome.
    res.status(200).json({ received: true });
  }
}
