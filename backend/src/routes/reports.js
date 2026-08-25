import express from 'express';
import Report from '../models/Report.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import { audit, notify } from '../utils/activity.js';

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { targetType, targetId, reason, details = '' } = req.body;
    if (!['Product', 'User', 'Order', 'Chat'].includes(targetType) || !targetId || !['fraud', 'unsafe_meetup', 'misleading_listing', 'harassment', 'counterfeit', 'other'].includes(reason)) return res.status(400).json({ msg: 'Please choose a valid safety report category.' });
    const existing = await Report.findOne({ targetType, targetId, reporter: req.user.id, status: { $in: ['open', 'in_review'] } });
    if (existing) return res.status(409).json({ msg: 'You already have an active report for this item.' });
    const report = await Report.create({ targetType, targetId, reporter: req.user.id, reason, details: String(details).trim() });
    const admin = await User.findOne({ role: 'admin' }).select('_id');
    if (admin) await notify(admin._id, 'safety', 'New safety report', `${reason.replace('_', ' ')} report needs review.`, '/admin');
    await audit(req.user.id, 'report.created', targetType, targetId, { reportId: report._id, reason });
    res.status(201).json(report);
  } catch (error) { console.error('[Reports] create failed:', error.message); res.status(500).json({ msg: 'Could not submit safety report.' }); }
});

export default router;
