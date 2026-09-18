import { Router } from 'express';
import { getMessageProvider } from '../../messaging/index.js';
import { handleInboundMessage } from '../../services/conversationService.js';

const router = Router();

/**
 * Each business gets its own webhook path so Meta can route messages to the
 * right tenant: /api/webhooks/whatsapp/:businessId
 *
 * Handles both:
 *  - GET  (Meta's subscription verification handshake)
 *  - POST (actual inbound message delivery)
 */
router.all('/:businessId', async (req, res, next) => {
  try {
    const provider = getMessageProvider('whatsapp');
    const { businessId } = req.params;

    await provider.handleWebhook(req, res, {
      businessId,
      onInboundMessages: async (messages) => {
        for (const msg of messages) {
          const result = await handleInboundMessage({
            businessId: msg.businessId,
            channel: 'whatsapp',
            externalThreadId: msg.externalThreadId,
            customerName: msg.customerName,
            customerPhone: msg.customerPhone,
            text: msg.text,
          });

          if (result.reply) {
            await provider.sendMessage({
              channel: 'whatsapp',
              externalThreadId: msg.externalThreadId,
              text: result.reply,
            });
          }
        }
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
