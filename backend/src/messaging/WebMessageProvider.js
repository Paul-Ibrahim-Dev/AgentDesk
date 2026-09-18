import { MessageProvider } from './MessageProvider.js';

/**
 * WebMessageProvider
 * ------------------
 * The MVP's real, working channel: a browser-based chat widget that calls
 * POST /api/chat/:businessId directly (no polling, no webhook needed).
 *
 * "sendMessage" here has nothing to push to (the browser reads the AI's
 * reply as the direct HTTP response), so it's a deliberate no-op — the
 * response is returned synchronously by the chat route instead. This keeps
 * the same MessageProvider shape as WhatsApp (which DOES need to push)
 * without pretending the web widget needs an outbound call it doesn't.
 */
export class WebMessageProvider extends MessageProvider {
  async sendMessage(message) {
    // No-op by design — see class doc comment.
    return { delivered: true, via: 'web-direct-response', message };
  }

  /**
   * The web widget calls the chat route with a simple JSON body:
   * { businessId, threadId, customerName?, customerPhone?, text }
   */
  receiveMessage(rawPayload) {
    const { businessId, threadId, customerName, customerPhone, text } = rawPayload;
    if (!businessId || !threadId || !text) {
      throw new Error('businessId, threadId and text are required.');
    }
    return [
      {
        businessId,
        channel: 'web',
        externalThreadId: threadId,
        customerName,
        customerPhone,
        text,
      },
    ];
  }

  async handleWebhook() {
    // The web widget has no webhook — it is called directly via /api/chat.
    throw new Error('WebMessageProvider has no webhook.');
  }
}
