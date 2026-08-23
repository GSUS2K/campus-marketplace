import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

const populateOrder = (query) => query
  .populate('buyer', ['name', 'email', 'campusLocation'])
  .populate('items.seller', ['name', 'email'])
  .populate('items.product', ['title', 'images', 'status']);

router.post('/', auth, async (req, res) => {
  try {
    const { items, pickupLocation = 'Main Gate', buyerNote = '' } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ msg: 'Add at least one listing before checkout.' });
    }

    const requested = items.map((item) => ({
      id: item.productId || item._id,
      quantity: Math.max(1, Number(item.quantity || 1))
    }));
    const products = await Product.find({ _id: { $in: requested.map((item) => item.id) }, status: 'active' });
    if (products.length !== requested.length) {
      return res.status(409).json({ msg: 'One or more listings are no longer available.' });
    }

    const productById = new Map(products.map((product) => [product.id, product]));
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
    const order = await new Order({ buyer: req.user.id, items: orderItems, total, pickupLocation, buyerNote }).save();
    await User.findByIdAndUpdate(req.user.id, { $inc: { totalTransactions: 1 } });
    res.status(201).json(await populateOrder(Order.findById(order._id)));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Could not create the test order.' });
  }
});

router.get('/mine', auth, async (req, res) => {
  try {
    const orders = await populateOrder(Order.find({ buyer: req.user.id }).sort({ createdAt: -1 }));
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Could not load your orders.' });
  }
});

router.get('/sales', auth, async (req, res) => {
  try {
    const orders = await populateOrder(Order.find({ 'items.seller': req.user.id }).sort({ createdAt: -1 }));
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
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: 'Order not found.' });
    const user = await User.findById(req.user.id);
    const canManage = user?.role === 'admin' || order.items.some((item) => String(item.seller) === req.user.id);
    if (!canManage) return res.status(403).json({ msg: 'Only a seller or admin can update this order.' });
    order.status = req.body.status;
    await order.save();
    res.json(await populateOrder(Order.findById(order._id)));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Could not update the order.' });
  }
});

router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, buyer: req.user.id });
    if (!order) return res.status(404).json({ msg: 'Order not found.' });
    if (!['placed', 'confirmed'].includes(order.status)) return res.status(409).json({ msg: 'This order can no longer be cancelled.' });
    order.status = 'cancelled';
    order.paymentStatus = 'refunded';
    await order.save();
    res.json(await populateOrder(Order.findById(order._id)));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Could not cancel the order.' });
  }
});

export default router;
