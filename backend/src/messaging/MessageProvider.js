/**
 * MessageProvider
 * ----------------
 * Every messaging channel (web chat widget, WhatsApp, future SMS/IG, etc.)
 * implements this same shape. The AI/conversation layer never talks to a
 * specific channel directly — it only calls these three methods — so a new
 * channel can be plugged in without touching conversation or AI logic.
 *
 * This is intentionally a plain JS "interface" (duck typing) rather than a
 * class hierarchy, since Node has no formal interfaces.
 */

/**
 * @typedef {Object} InboundMessage
 * @property {string} businessId
 * @property {string} channel            'web' | 'whatsapp'
 * @property {string} externalThreadId   stable id for the customer's thread on this channel
 * @property {string} [customerName]
 * @property {string} [customerPhone]
 * @property {string} text
 */

/**
 * @typedef {Object} OutboundMessage
 * @property {string} channel
 * @property {string} externalThreadId
 * @property {string} text
 */

export class MessageProvider {
  /** @param {OutboundMessage} message */
  // eslint-disable-next-line no-unused-vars
  async sendMessage(message) {
    throw new Error('sendMessage() not implemented');
  }

  /**
   * Normalizes a raw request body (e.g. a WhatsApp webhook payload, or a
   * simple JSON body from the web widget) into one or more InboundMessage.
   * @param {any} rawPayload
   * @returns {InboundMessage[]}
   */
  // eslint-disable-next-line no-unused-vars
  receiveMessage(rawPayload) {
    throw new Error('receiveMessage() not implemented');
  }

  /**
   * Express handler for the provider's inbound webhook route (verification
   * challenge handling, signature checks, etc). Providers that have no
   * webhook (like the web widget, which is called directly) can no-op this.
   */
  // eslint-disable-next-line no-unused-vars
  async handleWebhook(req, res) {
    throw new Error('handleWebhook() not implemented');
  }
}
