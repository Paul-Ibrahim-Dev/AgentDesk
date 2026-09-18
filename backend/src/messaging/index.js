import { WebMessageProvider } from './WebMessageProvider.js';
import { WhatsAppMessageProvider } from './WhatsAppMessageProvider.js';

const providers = {
  web: new WebMessageProvider(),
  whatsapp: new WhatsAppMessageProvider(),
};

/** @returns {import('./MessageProvider.js').MessageProvider} */
export function getMessageProvider(channel) {
  const provider = providers[channel];
  if (!provider) throw new Error(`Unknown messaging channel: ${channel}`);
  return provider;
}
