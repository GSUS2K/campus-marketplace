import express from 'express';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import TrustEngine from '../services/TrustEngine.js';
import { audit, notify } from '../utils/activity.js';

const router = express.Router();

router.get('/seller/:sellerId', async (req, res) => {
  try {
    const reviews = await Review.find({ seller: req.params.sellerId }).populate('reviewer', ['name']).sort({ createdAt: -1 }).limit(30);
    res.json(reviews);
  } catch (_error) { res.status(500).json({ msg: 'Could not load seller reviews.' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { orderId, productId, rating, comment = '' } = req.body;
    const numericRating = Number(rating);
    if (!orderId || !productId || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) return res.status(400).json({ msg: 'Choose a rating from 1 to 5.' });
    const order = await Order.findOne({ _id: orderId, buyer: req.user.id, status: 'completed' });
    const item = order?.items.find((entry) => String(entry.product) === String(productId));
    if (!order || !item) return res.status(403).json({ msg: 'Reviews are available after a completed handover.' });
    if (await Review.exists({ order: orderId, product: productId, reviewer: req.user.id })) return res.status(409).json({ msg: 'You already reviewed this item.' });
    const review = await Review.create({ order: orderId, product: productId, reviewer: req.user.id, seller: item.seller, rating: numericRating, comment: String(comment).trim() });
    const seller = await User.findById(item.seller);
    if (seller) {
      seller.feedbackScore += (numericRating - 3) / 10;
      await seller.save();
      await TrustEngine.recalculateTrustScore(seller._id);
      await notify(seller._id, 'order', 'New buyer feedback', `A buyer left a ${numericRating}/5 review for ${item.title}.`, '/profile');
    }
    await audit(req.user.id, 'review.created', 'Review', review._id, { rating: numericRating, productId });
    res.status(201).json(await Review.findById(review._id).populate('reviewer', ['name']));
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ msg: 'You already reviewed this item.' });
    console.error('[Reviews] create failed:', error.message); res.status(500).json({ msg: 'Could not submit review.' });
  }
});

export default router;
