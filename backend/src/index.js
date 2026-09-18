import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

import businessRoutes from './routes/business.js';
import serviceRoutes from './routes/services.js';
import faqRoutes from './routes/faqs.js';
import agentConfigRoutes from './routes/agentConfig.js';
import bookingRoutes from './routes/bookings.js';
import conversationRoutes from './routes/conversations.js';
import chatRoutes from './routes/chat.js';
import whatsappWebhookRoutes from './routes/webhooks/whatsapp.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json({ limit: '1mb' }));
  if (env.nodeEnv !== 'test') app.use(morgan('dev'));

  // General API rate limit (the customer-facing /api/chat route has its own,
  // tighter limiter defined alongside it).
  app.use(
    '/api',
    rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false })
  );

  app.get('/health', (req, res) => res.json({ ok: true, service: 'agentdesk-backend' }));

  // Dashboard (authenticated) routes
  app.use('/api/businesses', businessRoutes);
  app.use('/api/businesses/:businessId/services', serviceRoutes);
  app.use('/api/businesses/:businessId/faqs', faqRoutes);
  app.use('/api/businesses/:businessId/agent-config', agentConfigRoutes);
  app.use('/api/businesses/:businessId/bookings', bookingRoutes);
  app.use('/api/businesses/:businessId/conversations', conversationRoutes);

  // Public customer-facing chat (web widget)
  app.use('/api/chat', chatRoutes);

  // Messaging provider webhooks
  app.use('/api/webhooks/whatsapp', whatsappWebhookRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

// Only actually start listening when run directly (keeps the app importable/testable)
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  const app = createApp();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`AgentDesk backend listening on port ${env.port} (${env.nodeEnv})`);
  });
}
