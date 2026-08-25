import express from 'express';
import AnalyticsEngine from '../services/AnalyticsEngine.js';
import Product from '../models/Product.js';
import EventStream from '../models/EventStream.js';
import Order from '../models/Order.js';
import auth from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/analytics/view
 * Track a product view
 */
router.post('/view', async (req, res) => {
  try {
    const { productId, userId, location } = req.body;
    AnalyticsEngine.trackView(productId, userId, location);
    res.json({ success: true });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

/**
 * POST /api/analytics/search
 * Track a search
 */
router.post('/search', async (req, res) => {
  try {
    const { location, searchTerm, userId } = req.body;
    AnalyticsEngine.trackSearch(location, searchTerm, userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

/**
 * GET /api/analytics/demand
 * Fetch aggregated demand data for dashboard
 */
router.get('/demand', auth, async (req, res) => {
  try {
     // 1. Geographic Demand Surge (Products per location)
     const surgeAggregation = await Product.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: "$campusLocation", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 4 }
     ]);

     const totalProducts = await Product.countDocuments({ status: 'active' });
     
     let surgeLocations = surgeAggregation.map(loc => ({
        name: loc._id,
        demand: totalProducts > 0 ? Math.round((loc.count / totalProducts) * 100) : 0
     }));

     // If empty (e.g. no products), provide a baseline
     if (surgeLocations.length === 0) {
       surgeLocations = [{ name: 'SYSTEM_IDLE', demand: 0 }];
     }

     // 2. Asset Class Velocity (Count from EventStream or fallback to Product count)
     const categoryAggregation = await Product.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 3 }
     ]);

     const searchAggregation = await EventStream.aggregate([
        { $match: { eventType: 'SEARCH', 'metadata.searchTerm': { $exists: true } } },
        { $group: { _id: '$metadata.searchTerm', volume: { $sum: 1 } } },
        { $sort: { volume: -1 } },
        { $limit: 6 }
     ]);

     let trendingCategories = categoryAggregation.map(cat => ({
        name: cat._id,
        volume: searchAggregation.find((search) => String(search._id).toLowerCase() === String(cat._id).toLowerCase())?.volume || cat.count
     }));

     if (trendingCategories.length === 0) {
       trendingCategories = [{ name: 'SYSTEM_IDLE', volume: 0 }];
     }

     const data = {
        surgeLocations,
        trendingCategories,
        activeConnections: AnalyticsEngine.getActiveConnections(),
        totalActiveListings: totalProducts,
        totalSearches: await EventStream.countDocuments({ eventType: 'SEARCH' }),
        totalViews: await EventStream.countDocuments({ eventType: 'VIEW' }),
        scope: req.user.role === 'admin' ? 'marketplace' : 'seller'
     };
     if (req.user.role === 'seller') {
       const sellerProducts = await Product.find({ seller: req.user.id }).select('_id');
       data.sellerListings = sellerProducts.length;
       data.sellerViews = await EventStream.countDocuments({ eventType: 'VIEW', targetId: { $in: sellerProducts.map((product) => product._id) } });
       const sellerOrders = await Order.find({ 'items.seller': req.user.id }).select('items total status');
       const sellerItems = sellerOrders.flatMap((order) => order.items.filter((item) => String(item.seller) === String(req.user.id)));
       data.sellerOrders = sellerOrders.length;
       data.sellerCompletedOrders = sellerOrders.filter((order) => order.status === 'completed').length;
       data.sellerPendingOrders = sellerOrders.filter((order) => ['placed', 'confirmed', 'ready'].includes(order.status)).length;
       data.sellerRevenue = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
       data.sellerConversionRate = data.sellerViews ? Math.round((data.sellerOrders / data.sellerViews) * 100) : 0;
       data.sellerAverageOrderValue = data.sellerOrders ? Math.round(data.sellerRevenue / data.sellerOrders) : 0;
     } else if (req.user.role === 'buyer') {
       const buyerOrders = await Order.find({ buyer: req.user.id }).select('total status items');
       data.buyerOrders = buyerOrders.length;
       data.buyerSpend = buyerOrders.filter((order) => order.status !== 'cancelled').reduce((sum, order) => sum + order.total, 0);
       data.buyerActiveOrders = buyerOrders.filter((order) => !['completed', 'cancelled'].includes(order.status)).length;
       data.buyerCompletedOrders = buyerOrders.filter((order) => order.status === 'completed').length;
       data.buyerSavedValue = buyerOrders.filter((order) => order.status !== 'cancelled').reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0), 0);
     }
     res.json(data);
  } catch (err) {
     console.error("Analytics Error:", err);
     res.status(500).send('Server Error');
  }
});

export default router;
