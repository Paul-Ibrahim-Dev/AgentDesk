import { Router } from 'express';
import { requireAuth, requireBusinessMembership } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { runAgentTurn } from '../services/aiAgent.js';

const router = Router({ mergeParams: true });
router.use(requireAuth, requireBusinessMembership);

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await req.supabase
      .from('agent_configs')
      .select('*')
      .eq('business_id', req.businessId)
      .maybeSingle();
    if (error) throw error;
    res.json({ agentConfig: data });
  } catch (err) {
    next(err);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const allowed = [
      'agent_name',
      'greeting',
      'tone',
      'instructions',
      'escalation_message',
      'booking_behaviour',
      'is_published',
    ];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

    const { data, error } = await req.supabase
      .from('agent_configs')
      .update(updates)
      .eq('business_id', req.businessId)
      .select()
      .single();
    if (error) throw error;
    res.json({ agentConfig: data });
  } catch (err) {
    next(err);
  }
});

// Lets the owner try out the agent (as configured, even if unpublished)
// before going live — uses a throwaway in-memory conversation, no rows saved.
router.post('/preview', async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required.' });

    const [{ data: business, error: bizErr }, { data: agentConfig, error: cfgErr }] = await Promise.all([
      supabaseAdmin.from('businesses').select('*').eq('id', req.businessId).single(),
      supabaseAdmin.from('agent_configs').select('*').eq('business_id', req.businessId).single(),
    ]);
    if (bizErr) throw bizErr;
    if (cfgErr) throw cfgErr;

    const result = await runAgentTurn({
      db: supabaseAdmin,
      businessId: req.businessId,
      business,
      agentConfig,
      history: [...history, { role: 'user', content: message }],
      conversationId: null, // preview never escalates a real conversation
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
