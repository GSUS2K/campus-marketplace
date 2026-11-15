import express from 'express';
import WantedRequest from '../models/WantedRequest.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import { audit, notify } from '../utils/activity.js';

const router = express.Router();
const categories = ['Books', 'Electronics', 'Apparel', 'Miscellaneous'];

router.get('/', async (_req, res) => {
  try {
    const requests = await WantedRequest.find({ status: 'open' }).populate('requester', ['name', 'trustScore']).sort({ createdAt: -1 }).limit(100);
    res.json(requests);
  } catch (_error) { res.status(500).json({ msg: 'Could not load campus requests.' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('status role campusLocation');
    if (!user || user.status !== 'verified') return res.status(403).json({ msg: 'A verified campus account is required.' });
    const { title, description, category, budget, campusLocation } = req.body;
    if (!String(title || '').trim() || !String(description || '').trim() || !categories.includes(category)) return res.status(400).json({ msg: 'Add a title, description, and valid category.' });
    if (!Number.isFinite(Number(budget)) || Number(budget) < 0 || Number(budget) > 100000) return res.status(400).json({ msg: 'Enter a valid budget.' });
    const request = await WantedRequest.create({ title, description, category, budget: Number(budget), campusLocation: String(campusLocation || user.campusLocation || 'Campus').trim(), requester: req.user.id });
    await audit(req.user.id, 'request.created', 'WantedRequest', request._id, { category, budget: request.budget });
    res.status(201).json(await WantedRequest.findById(request._id).populate('requester', ['name', 'trustScore']));
  } catch (_error) { res.status(500).json({ msg: 'Could not create your campus request.' }); }
});

router.put('/:id/status', auth, async (req, res) => {
  try {
    if (!['fulfilled', 'closed'].includes(req.body.status)) return res.status(400).json({ msg: 'Invalid request status.' });
    const request = await WantedRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ msg: 'Campus request not found.' });
    const user = await User.findById(req.user.id).select('role');
    if (String(request.requester) !== req.user.id && user?.role !== 'admin') return res.status(403).json({ msg: 'Only the requester or an administrator can close this request.' });
    request.status = req.body.status;
    await request.save();
    await audit(req.user.id, `request.${request.status}`, 'WantedRequest', request._id);
    await notify(request.requester, 'system', 'Campus request updated', `Your request “${request.title}” is marked ${request.status}.`, '/requests');
    res.json(request);
  } catch (_error) { res.status(500).json({ msg: 'Could not update this campus request.' }); }
});

export default router;
