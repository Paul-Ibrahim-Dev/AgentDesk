import { Router } from 'express';
import { requireAuth, requireBusinessMembership } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';

const router = Router({ mergeParams: true });
router.use(requireAuth, requireBusinessMembership);

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = req.supabase
      .from('bookings')
      .select('*, services(name)')
      .eq('business_id', req.businessId)
      .order('booking_date', { ascending: true });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ bookings: data });
  } catch (err) {
    next(err);
  }
});

const VALID_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

router.patch('/:bookingId', async (req, res, next) => {
  try {
    const { status, notes, booking_date, booking_time } = req.body;
    if (status && !VALID_STATUSES.includes(status)) {
      throw new HttpError(400, `status must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const updates = {};
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (booking_date) updates.booking_date = booking_date;
    if (booking_time) updates.booking_time = booking_time;

    const { data, error } = await req.supabase
      .from('bookings')
      .update(updates)
      .eq('id', req.params.bookingId)
      .eq('business_id', req.businessId)
      .select()
      .single();
    if (error) throw error;
    if (!data) throw new HttpError(404, 'Booking not found.');
    res.json({ booking: data });
  } catch (err) {
    next(err);
  }
});

export default router;
