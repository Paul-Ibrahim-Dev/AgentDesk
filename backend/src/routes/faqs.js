import { Router } from 'express';
import { requireAuth, requireBusinessMembership } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';

const router = Router({ mergeParams: true });
router.use(requireAuth, requireBusinessMembership);

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await req.supabase
      .from('faqs')
      .select('*')
      .eq('business_id', req.businessId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json({ faqs: data });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) throw new HttpError(400, 'question and answer are required.');

    const { data, error } = await req.supabase
      .from('faqs')
      .insert({ business_id: req.businessId, question, answer })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ faq: data });
  } catch (err) {
    next(err);
  }
});

router.put('/:faqId', async (req, res, next) => {
  try {
    const allowed = ['question', 'answer'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

    const { data, error } = await req.supabase
      .from('faqs')
      .update(updates)
      .eq('id', req.params.faqId)
      .eq('business_id', req.businessId)
      .select()
      .single();
    if (error) throw error;
    if (!data) throw new HttpError(404, 'FAQ not found.');
    res.json({ faq: data });
  } catch (err) {
    next(err);
  }
});

router.delete('/:faqId', async (req, res, next) => {
  try {
    const { error } = await req.supabase
      .from('faqs')
      .delete()
      .eq('id', req.params.faqId)
      .eq('business_id', req.businessId);
    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
