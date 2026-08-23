import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Chat from '../models/Chat.js';
import auth from '../middleware/auth.js';

const router = express.Router();
const requireAdmin = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('role');
  if (!user || user.role !== 'admin') return res.status(403).json({ msg: 'Administrative privileges required.' });
  next();
};

router.use(auth, requireAdmin);

router.get('/overview', async (_req, res) => {
  try {
    const [users, sellers, pendingSellers, pendingListings, orders, escalations] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'seller', status: 'verified' }),
      User.find({ role: 'seller', status: { $in: ['pending', 'review'] } }).select('name email campusLocation status trustScore createdAt').sort({ createdAt: 1 }),
      Product.find({ isVerifiedProduct: false, status: { $in: ['pending_review', 'active'] } }).populate('seller', ['name', 'email', 'status']).sort({ createdAt: 1 }),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$total' } } }]),
      Chat.find({ isIntermediaryActive: true, status: { $ne: 'closed' } }).populate('product', ['title', 'price']).populate('buyer', ['name', 'email']).populate('seller', ['name', 'email']).populate('adminIntermediary', ['name', 'email']).sort({ updatedAt: -1 })
    ]);
    res.json({ metrics: { users, sellers, pendingSellers: pendingSellers.length, pendingListings: pendingListings.length, escalations: escalations.length }, pendingSellers, pendingListings, orders, escalations });
  } catch (err) {
    console.error('[Admin] overview failed:', err.message);
    res.status(500).json({ msg: 'Could not load admin overview.' });
  }
});

router.put('/users/:id/status', async (req, res) => {
  try {
    if (!['verified', 'rejected', 'review'].includes(req.body.status)) return res.status(400).json({ msg: 'Invalid verification status.' });
    const user = await User.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).select('name email role status campusLocation trustScore');
    if (!user) return res.status(404).json({ msg: 'User not found.' });
    res.json(user);
  } catch (err) {
    console.error('[Admin] user status failed:', err.message);
    res.status(500).json({ msg: 'Could not update seller verification.' });
  }
});

router.put('/chats/:id/assign', async (req, res) => {
  try {
    const chat = await Chat.findByIdAndUpdate(req.params.id, { adminIntermediary: req.user.id, isIntermediaryActive: true }, { new: true }).populate('adminIntermediary', ['name', 'email']);
    if (!chat) return res.status(404).json({ msg: 'Escalation not found.' });
    res.json(chat);
  } catch (err) {
    console.error('[Admin] escalation assignment failed:', err.message);
    res.status(500).json({ msg: 'Could not assign this escalation.' });
  }
});

export default router;
