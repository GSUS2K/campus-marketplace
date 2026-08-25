import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import crypto from 'crypto';
import { audit, notify } from '../utils/activity.js';

const router = express.Router();

const populateOrder = (query) => query
  .populate('buyer', ['name', 'email', 'campusLocation'])
  .populate('items.seller', ['name', 'email'])
  .populate('items.product', ['title', 'images', 'status']);

router.post('/', auth, async (req, res) => {
  try {
    const { items, pickupLocation = 'Main Gate', pickupSlot = '', buyerNote = '' } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ msg: 'Add at least one listing before checkout.' });
    }

    const requested = items.map((item) => ({
      id: item.productId || item._id,
      quantity: Math.min(1, Math.max(1, Number(item.quantity || 1)))
    }));
    const products = await Product.find({ _id: { $in: requested.map((item) => item.id) }, status: 'active', isVerifiedProduct: true });
    if (products.length !== requested.length) {
      return res.status(409).json({ msg: 'One or more listings are no longer available.' });
    }

    const productById = new Map(products.map((product) => [product.id, product]));
    const reservedProducts = [];
    const reservationCutoff = new Date(Date.now() + 30 * 60 * 1000);
    for (const { id } of requested) {
      const reserved = await Product.findOneAndUpdate({ _id: id, isVerifiedProduct: true, $or: [{ status: 'active' }, { status: 'reserved', reservedUntil: { $lt: new Date() } }] }, { $set: { status: 'reserved', reservedBy: req.user.id, reservedUntil: reservationCutoff } }, { new: true });
      if (!reserved) {
        if (reservedProducts.length) await Product.updateMany({ _id: { $in: reservedProducts }, reservedBy: req.user.id }, { $set: { status: 'active', reservedBy: null, reservedUntil: null } });
        return res.status(409).json({ msg: 'One or more listings were just reserved by another buyer.' });
      }
      reservedProducts.push(reserved._id);
    }
    const orderItems = requested.map(({ id, quantity }) => {
      const product = productById.get(String(id));
      return {
        product: product._id,
        seller: product.seller,
        title: product.title,
        image: product.images?.[0] || '',
        price: product.price,
        quantity
      };
    });
    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let order;
    try {
      order = await new Order({ buyer: req.user.id, items: orderItems, total, pickupLocation, pickupSlot, buyerNote, handoverCode: crypto.randomBytes(3).toString('hex').toUpperCase() }).save();
    } catch (error) {
      await Product.updateMany({ _id: { $in: reservedProducts }, reservedBy: req.user.id }, { $set: { status: 'active', reservedBy: null, reservedUntil: null } });
      throw error;
    }
    await User.findByIdAndUpdate(req.user.id, { $inc: { totalTransactions: 1 } });
    for (const sellerId of new Set(orderItems.map((item) => String(item.seller)))) await notify(sellerId, 'order', 'New campus order', `A buyer placed an order for ${orderItems.length} listing${orderItems.length === 1 ? '' : 's'}.`, '/orders');
    await audit(req.user.id, 'order.created', 'Order', order._id, { total, pickupLocation, pickupSlot });
    res.status(201).json(await populateOrder(Order.findById(order._id)));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Could not create the test order.' });
  }
});

router.get('/mine', auth, async (req, res) => {
  try {
    const orders = await populateOrder(Order.find({ buyer: req.user.id }).select('+handoverCode').sort({ createdAt: -1 }));
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Could not load your orders.' });
  }
});

router.get('/sales', auth, async (req, res) => {
  try {
    const orders = await populateOrder(Order.find({ 'items.seller': req.user.id }).select('+handoverCode').sort({ createdAt: -1 }));
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Could not load seller orders.' });
  }
});

router.put('/:id/status', auth, async (req, res) => {
  try {
    const allowed = ['placed', 'confirmed', 'ready', 'completed', 'cancelled'];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ msg: 'Invalid order status.' });
    if (req.body.status === 'completed' && req.user.role !== 'admin') return res.status(400).json({ msg: 'Complete the handover with the shared pickup code.' });
    const order = await Order.findById(req.params.id).select('+handoverCode');
    if (!order) return res.status(404).json({ msg: 'Order not found.' });
    const user = await User.findById(req.user.id);
    const canManage = user?.role === 'admin' || order.items.some((item) => String(item.seller) === req.user.id);
    if (!canManage) return res.status(403).json({ msg: 'Only a seller or admin can update this order.' });
    order.status = req.body.status;
    await order.save();
    if (order.status === 'completed') await Product.updateMany({ _id: { $in: order.items.map((item) => item.product) } }, { $set: { status: 'sold', reservedBy: null, reservedUntil: null } });
    if (order.status === 'cancelled') await Product.updateMany({ _id: { $in: order.items.map((item) => item.product) }, reservedBy: order.buyer }, { $set: { status: 'active', reservedBy: null, reservedUntil: null } });
    await audit(req.user.id, `order.${order.status}`, 'Order', order._id);
    if (String(order.buyer) !== req.user.id) await notify(order.buyer, 'order', 'Order status updated', `Your order is now ${order.status}.`, '/orders');
    res.json(await populateOrder(Order.findById(order._id)));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Could not update the order.' });
  }
});

router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, buyer: req.user.id }).select('+handoverCode');
    if (!order) return res.status(404).json({ msg: 'Order not found.' });
    if (!['placed', 'confirmed'].includes(order.status)) return res.status(409).json({ msg: 'This order can no longer be cancelled.' });
    order.status = 'cancelled';
    order.paymentStatus = 'refunded';
    await order.save();
    await Product.updateMany({ _id: { $in: order.items.map((item) => item.product) }, reservedBy: order.buyer }, { $set: { status: 'active', reservedBy: null, reservedUntil: null } });
    await audit(req.user.id, 'order.cancelled', 'Order', order._id);
    res.json(await populateOrder(Order.findById(order._id)));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Could not cancel the order.' });
  }
});

router.put('/:id/handover/confirm', auth, async (req, res) => {
  try {
    const { code } = req.body;
    const order = await Order.findById(req.params.id).select('+handoverCode');
    if (!order) return res.status(404).json({ msg: 'Order not found.' });
    const isBuyer = String(order.buyer) === req.user.id;
    const isSeller = order.items.some((item) => String(item.seller) === req.user.id);
    if (!isBuyer && !isSeller) return res.status(403).json({ msg: 'You are not part of this handover.' });
    if (String(code || '').trim().toUpperCase() !== order.handoverCode) return res.status(400).json({ msg: 'Handover code does not match.' });
    if (isBuyer) order.buyerConfirmedAt = new Date();
    if (isSeller) order.sellerConfirmedAt = new Date();
    if (order.buyerConfirmedAt && order.sellerConfirmedAt) {
      order.handoverConfirmedAt = new Date();
      order.status = 'completed';
      await Product.updateMany({ _id: { $in: order.items.map((item) => item.product) } }, { $set: { status: 'sold', reservedBy: null, reservedUntil: null } });
      const sellerIds = [...new Set(order.items.map((item) => String(item.seller?._id || item.seller)))];
      await Promise.all(sellerIds.map((sellerId) => User.findByIdAndUpdate(sellerId, { $inc: { successfulTransactions: 1 } })));
    } else if (order.status === 'placed') order.status = 'ready';
    await order.save();
    await audit(req.user.id, 'order.handover_confirmed', 'Order', order._id, { isBuyer, isSeller, completed: Boolean(order.handoverConfirmedAt) });
    const otherParty = isBuyer ? order.items[0].seller : order.buyer;
    await notify(otherParty, 'order', order.handoverConfirmedAt ? 'Handover completed' : 'Handover confirmation received', order.handoverConfirmedAt ? 'Both parties confirmed the campus handover.' : 'The other party confirmed the handover code.', '/orders');
    res.json(await populateOrder(Order.findById(order._id).select('+handoverCode')));
  } catch (error) { console.error('[Orders] handover failed:', error.message); res.status(500).json({ msg: 'Could not confirm the handover.' }); }
});

export default router;
