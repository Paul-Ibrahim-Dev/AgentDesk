import { Router } from 'express';
import { requireAuth, requireBusinessMembership } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';

const router = Router();
router.use(requireAuth);

// List businesses the current user belongs to
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await req.supabase
      .from('businesses')
      .select('*, business_members!inner(user_id, role)')
      .eq('business_members.user_id', req.user.id);
    if (error) throw error;
    res.json({ businesses: data });
  } catch (err) {
    next(err);
  }
});

// Create a new business (owner = current user), plus a default agent config
router.post('/', async (req, res, next) => {
  try {
    const { name, description, phone, whatsapp_number, email, address, website, social_links, opening_hours, slug } =
      req.body;
    if (!name) throw new HttpError(400, 'Business name is required.');

    const { data: business, error: bizErr } = await req.supabase
      .from('businesses')
      .insert({
        owner_id: req.user.id,
        name,
        description,
        phone,
        whatsapp_number,
        email,
        address,
        website,
        social_links: social_links || {},
        opening_hours: opening_hours || {},
        slug: slug || null,
      })
      .select()
      .single();
    if (bizErr) throw bizErr;

    const { error: memberErr } = await req.supabase
      .from('business_members')
      .insert({ business_id: business.id, user_id: req.user.id, role: 'owner' });
    if (memberErr) throw memberErr;

    const { error: cfgErr } = await req.supabase.from('agent_configs').insert({
      business_id: business.id,
      agent_name: `${name} Assistant`,
      greeting: `Hi, welcome to ${name}! How can I help you today?`,
    });
    if (cfgErr) throw cfgErr;

    res.status(201).json({ business });
  } catch (err) {
    next(err);
  }
});

router.get('/:businessId', requireBusinessMembership, async (req, res, next) => {
  try {
    const { data, error } = await req.supabase.from('businesses').select('*').eq('id', req.businessId).single();
    if (error) throw error;
    res.json({ business: data });
  } catch (err) {
    next(err);
  }
});

router.put('/:businessId', requireBusinessMembership, async (req, res, next) => {
  try {
    const allowed = [
      'name',
      'description',
      'phone',
      'whatsapp_number',
      'email',
      'address',
      'website',
      'social_links',
      'opening_hours',
      'slug',
    ];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

    const { data, error } = await req.supabase
      .from('businesses')
      .update(updates)
      .eq('id', req.businessId)
      .select()
      .single();
    if (error) throw error;
    res.json({ business: data });
  } catch (err) {
    next(err);
  }
});

// Dashboard overview stats
router.get('/:businessId/overview', requireBusinessMembership, async (req, res, next) => {
  try {
    const businessId = req.businessId;

    const [conversations, newEnquiries, bookings, pendingFollowUps, recentConversations] = await Promise.all([
      req.supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('business_id', businessId),
      req.supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      req.supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('business_id', businessId),
      req.supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'human_required'),
      req.supabase
        .from('conversations')
        .select('id, customer_name, customer_phone, channel, status, last_message_at')
        .eq('business_id', businessId)
        .order('last_message_at', { ascending: false })
        .limit(10),
    ]);

    res.json({
      totalConversations: conversations.count || 0,
      newEnquiries24h: newEnquiries.count || 0,
      totalBookings: bookings.count || 0,
      pendingHumanFollowUps: pendingFollowUps.count || 0,
      recentConversations: recentConversations.data || [],
    });
  } catch (err) {
    next(err);
  }
});

export default router;
