import express from 'express';
import Notification from '../models/Notification.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/mine', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 }).limit(40);
    res.json({ unread: notifications.filter((item) => !item.readAt).length, notifications });
  } catch (_error) { res.status(500).json({ msg: 'Could not load notifications.' }); }
});

router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user.id }, { readAt: new Date() }, { new: true });
    if (!notification) return res.status(404).json({ msg: 'Notification not found.' });
    res.json(notification);
  } catch (_error) { res.status(500).json({ msg: 'Could not update notification.' }); }
});

export default router;
