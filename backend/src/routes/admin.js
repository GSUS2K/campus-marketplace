import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Chat from '../models/Chat.js';
import Report from '../models/Report.js';
import AuditLog from '../models/AuditLog.js';
import auth from '../middleware/auth.js';
import { audit, notify } from '../utils/activity.js';

const router = express.Router();
const requireModerator = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('role');
  if (!user || !['admin', 'intermediary'].includes(user.role)) return res.status(403).json({ msg: 'Moderator access required.' });
  req.moderator = user;
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.moderator?.role !== 'admin') return res.status(403).json({ msg: 'Administrator access required.' });
  next();
};

router.use(auth, requireModerator);

router.get('/overview', async (req, res) => {
  try {
    const isAdmin = req.moderator.role === 'admin';
    const escalationQuery = isAdmin ? { isIntermediaryActive: true, status: { $ne: 'closed' } } : { isIntermediaryActive: true, status: { $ne: 'closed' }, $or: [{ adminIntermediary: null }, { adminIntermediary: req.user.id }] };
    const reportQuery = isAdmin ? { status: { $in: ['open', 'in_review'] } } : { status: { $in: ['open', 'in_review'] }, $or: [{ assignedTo: null }, { assignedTo: req.user.id }] };
    const [users, sellers, pendingSellers, pendingListings, orders, escalations, reports] = await Promise.all([
      isAdmin ? User.countDocuments() : Promise.resolve(0),
      isAdmin ? User.countDocuments({ role: 'seller', status: 'verified' }) : Promise.resolve(0),
      isAdmin ? User.find({ role: 'seller', status: { $in: ['pending', 'review'] } }).select('name email campusLocation status trustScore createdAt').sort({ createdAt: 1 }) : Promise.resolve([]),
      isAdmin ? Product.find({ isVerifiedProduct: false, status: { $in: ['pending_review', 'active'] } }).populate('seller', ['name', 'email', 'status']).sort({ createdAt: 1 }) : Promise.resolve([]),
      isAdmin ? Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$total' } } }]) : Promise.resolve([]),
      Chat.find(escalationQuery).populate('product', ['title', 'price']).populate('buyer', ['name', 'email']).populate('seller', ['name', 'email']).populate('adminIntermediary', ['name', 'email']).sort({ updatedAt: -1 }),
      Report.find(reportQuery).populate('reporter', ['name', 'email']).sort({ createdAt: 1 })
    ]);
    res.json({ role: req.moderator.role, metrics: { users, sellers, pendingSellers: pendingSellers.length, pendingListings: pendingListings.length, escalations: escalations.length, reports: reports.length }, pendingSellers, pendingListings, orders, escalations, reports });
  } catch (err) {
    console.error('[Admin] overview failed:', err.message);
    res.status(500).json({ msg: 'Could not load admin overview.' });
  }
});

router.put('/users/:id/status', requireAdmin, async (req, res) => {
  try {
    if (!['verified', 'rejected', 'review'].includes(req.body.status)) return res.status(400).json({ msg: 'Invalid verification status.' });
    const user = await User.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).select('name email role status campusLocation trustScore');
    if (!user) return res.status(404).json({ msg: 'User not found.' });
    await audit(req.user.id, `seller.${user.status}`, 'User', user._id, { email: user.email });
    await notify(user._id, 'moderation', `Seller access ${user.status}`, user.status === 'verified' ? 'Your seller access is now active.' : `Your seller application is marked ${user.status}.`, '/profile');
    res.json(user);
  } catch (err) {
    console.error('[Admin] user status failed:', err.message);
    res.status(500).json({ msg: 'Could not update seller verification.' });
  }
});

router.put('/chats/:id/assign', async (req, res) => {
  try {
    const current = await Chat.findById(req.params.id);
    if (!current) return res.status(404).json({ msg: 'Escalation not found.' });
    if (req.moderator.role === 'intermediary' && current.adminIntermediary && String(current.adminIntermediary) !== req.user.id) return res.status(409).json({ msg: 'This case is already assigned to another intermediary.' });
    const chat = await Chat.findByIdAndUpdate(req.params.id, { adminIntermediary: req.user.id, isIntermediaryActive: true }, { new: true }).populate('adminIntermediary', ['name', 'email']);
    if (!chat) return res.status(404).json({ msg: 'Escalation not found.' });
    await audit(req.user.id, 'chat.intermediary_assigned', 'Chat', chat._id, { buyer: chat.buyer, seller: chat.seller });
    await Promise.all([notify(chat.buyer, 'safety', 'A moderator joined your handover', 'A campus moderator is now available to help resolve this conversation.', '/orders'), notify(chat.seller, 'safety', 'A moderator joined your handover', 'A campus moderator is now available to help resolve this conversation.', '/orders')]);
    res.json(chat);
  } catch (err) {
    console.error('[Admin] escalation assignment failed:', err.message);
    res.status(500).json({ msg: 'Could not assign this escalation.' });
  }
});

router.get('/audit', requireAdmin, async (_req, res) => {
  try {
    const logs = await AuditLog.find().populate('actor', ['name', 'email', 'role']).sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (_error) { res.status(500).json({ msg: 'Could not load audit history.' }); }
});

router.put('/reports/:id', async (req, res) => {
  try {
    const allowed = ['open', 'in_review', 'resolved', 'dismissed'];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ msg: 'Invalid report status.' });
    const current = await Report.findById(req.params.id);
    if (!current) return res.status(404).json({ msg: 'Report not found.' });
    if (req.moderator.role === 'intermediary' && current.assignedTo && String(current.assignedTo) !== req.user.id) return res.status(409).json({ msg: 'This report is assigned to another intermediary.' });
    const report = await Report.findByIdAndUpdate(req.params.id, { status: req.body.status, assignedTo: req.user.id, resolution: String(req.body.resolution || '').trim() }, { new: true }).populate('reporter', ['name', 'email']);
    if (!report) return res.status(404).json({ msg: 'Report not found.' });
    await AuditLog.create({ actor: req.user.id, action: `report.${report.status}`, entityType: report.targetType, entityId: report.targetId, details: { reportId: report._id, resolution: report.resolution } });
    res.json(report);
  } catch (_error) { res.status(500).json({ msg: 'Could not update report.' }); }
});

export default router;
