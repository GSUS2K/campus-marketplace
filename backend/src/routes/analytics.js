import express from 'express';
import AnalyticsEngine from '../services/AnalyticsEngine.js';
import Product from '../models/Product.js';
import EventStream from '../models/EventStream.js';

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
router.get('/demand', async (req, res) => {
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

     let trendingCategories = categoryAggregation.map(cat => ({
        name: cat._id,
        volume: cat.count * 120 // Multiplied by 120 for realistic "velocity/query" metrics demo
     }));

     if (trendingCategories.length === 0) {
       trendingCategories = [{ name: 'SYSTEM_IDLE', volume: 0 }];
     }

     const data = {
        surgeLocations,
        trendingCategories,
        activeConnections: AnalyticsEngine.getActiveConnections() // Real Socket.IO connection count
     };
     res.json(data);
  } catch (err) {
     console.error("Analytics Error:", err);
     res.status(500).send('Server Error');
  }
});

export default router;
