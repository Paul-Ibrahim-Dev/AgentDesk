import { Router } from 'express';
import { requireAuth, requireBusinessMembership } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { saveMessage } from '../services/conversationService.js';
import { getMessageProvider } from '../messaging/index.js';

const router = Router({ mergeParams: true });
router.use(requireAuth, requireBusinessMembership);

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = req.supabase
      .from('conversations')
      .select('*')
      .eq('business_id', req.businessId)
      .order('last_message_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ conversations: data });
  } catch (err) {
    next(err);
  }
});

router.get('/:conversationId', async (req, res, next) => {
  try {
    const { data: conversation, error: convErr } = await req.supabase
      .from('conversations')
      .select('*')
      .eq('id', req.params.conversationId)
      .eq('business_id', req.businessId)
      .single();
    if (convErr) throw convErr;
    if (!conversation) throw new HttpError(404, 'Conversation not found.');

    const { data: messages, error: msgErr } = await req.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });
    if (msgErr) throw msgErr;

    res.json({ conversation, messages });
  } catch (err) {
    next(err);
  }
});

// Owner manually takes over
router.post('/:conversationId/take-over', async (req, res, next) => {
  try {
    const { data, error } = await req.supabase
      .from('conversations')
      .update({ status: 'human_handling' })
      .eq('id', req.params.conversationId)
      .eq('business_id', req.businessId)
      .select()
      .single();
    if (error) throw error;
    if (!data) throw new HttpError(404, 'Conversation not found.');
    res.json({ conversation: data });
  } catch (err) {
    next(err);
  }
});

// Owner marks a conversation resolved
router.post('/:conversationId/resolve', async (req, res, next) => {
  try {
    const { data, error } = await req.supabase
      .from('conversations')
      .update({ status: 'resolved' })
      .eq('id', req.params.conversationId)
      .eq('business_id', req.businessId)
      .select()
      .single();
    if (error) throw error;
    if (!data) throw new HttpError(404, 'Conversation not found.');
    res.json({ conversation: data });
  } catch (err) {
    next(err);
  }
});

// Owner sends a manual reply — goes out over the same channel the customer used
router.post('/:conversationId/reply', async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) throw new HttpError(400, 'text is required.');

    const { data: conversation, error: convErr } = await req.supabase
      .from('conversations')
      .select('*')
      .eq('id', req.params.conversationId)
      .eq('business_id', req.businessId)
      .single();
    if (convErr) throw convErr;
    if (!conversation) throw new HttpError(404, 'Conversation not found.');

    const message = await saveMessage({
      conversationId: conversation.id,
      businessId: req.businessId,
      senderType: 'owner',
      content: text,
    });

    // Ensure conversation reflects a human is now actively handling it.
    await req.supabase
      .from('conversations')
      .update({ status: 'human_handling' })
      .eq('id', conversation.id);

    // Push the reply out over the channel the customer is actually on.
    const provider = getMessageProvider(conversation.channel);
    await provider.sendMessage({
      channel: conversation.channel,
      externalThreadId: conversation.external_thread_id,
      text,
    });

    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
});

export default router;
