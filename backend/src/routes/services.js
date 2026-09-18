import { Router } from 'express';
import { requireAuth, requireBusinessMembership } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';

const router = Router({ mergeParams: true });
router.use(requireAuth, requireBusinessMembership);

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await req.supabase
      .from('services')
      .select('*')
      .eq('business_id', req.businessId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json({ services: data });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, description, price, currency, duration_minutes, booking_enabled, is_available } = req.body;
    if (!name) throw new HttpError(400, 'Service name is required.');
    if (price !== undefined && (isNaN(price) || price < 0)) {
      throw new HttpError(400, 'Price must be a non-negative number.');
    }

    const { data, error } = await req.supabase
      .from('services')
      .insert({
        business_id: req.businessId,
        name,
        description,
        price,
        currency: currency || 'NGN',
        duration_minutes,
        booking_enabled: booking_enabled ?? true,
        is_available: is_available ?? true,
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ service: data });
  } catch (err) {
    next(err);
  }
});

router.put('/:serviceId', async (req, res, next) => {
  try {
    const allowed = ['name', 'description', 'price', 'currency', 'duration_minutes', 'booking_enabled', 'is_available'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

    const { data, error } = await req.supabase
      .from('services')
      .update(updates)
      .eq('id', req.params.serviceId)
      .eq('business_id', req.businessId)
      .select()
      .single();
    if (error) throw error;
    if (!data) throw new HttpError(404, 'Service not found.');
    res.json({ service: data });
  } catch (err) {
    next(err);
  }
});

router.delete('/:serviceId', async (req, res, next) => {
  try {
    const { error } = await req.supabase
      .from('services')
      .delete()
      .eq('id', req.params.serviceId)
      .eq('business_id', req.businessId);
    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
