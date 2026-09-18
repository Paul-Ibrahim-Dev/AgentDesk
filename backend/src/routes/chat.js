import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { HttpError } from '../middleware/errorHandler.js';
import { getMessageProvider } from '../messaging/index.js';
import { handleInboundMessage } from '../services/conversationService.js';

const router = Router();

// Public endpoint hit directly by customers — protect it from abuse.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages sent too quickly. Please slow down.' },
});

/**
 * POST /api/chat/:businessId
 * body: { threadId, customerName?, customerPhone?, text }
 *
 * `threadId` should be a stable id the widget generates once per visitor
 * (e.g. a UUID stored in localStorage) so their conversation persists
 * across page reloads.
 */
router.post('/:businessId', chatLimiter, async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const provider = getMessageProvider('web');
    const [inbound] = provider.receiveMessage({ businessId, ...req.body });

    if (!inbound.text || !inbound.text.trim()) {
      throw new HttpError(400, 'text is required.');
    }

    const result = await handleInboundMessage({
      businessId: inbound.businessId,
      channel: inbound.channel,
      externalThreadId: inbound.externalThreadId,
      customerName: inbound.customerName,
      customerPhone: inbound.customerPhone,
      text: inbound.text,
    });

    res.json({
      reply: result.reply,
      status: result.conversation.status,
      handedToHuman: result.handedToHuman,
      conversationId: result.conversation.id,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
