import express from 'express';
import TrustEngine from '../services/TrustEngine.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * GET /api/trust/:userId/score
 * Recalculate and return the latest trust score for a user
 */
router.get('/:userId/score', async (req, res) => {
  try {
    const { userId } = req.params;
    const score = await TrustEngine.recalculateTrustScore(userId);
    
    if (score === undefined) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json({ trustScore: score });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * GET /api/trust/:sellerId/intermediary
 * Check if a seller's chat requires an admin intermediary
 */
router.get('/:sellerId/intermediary', async (req, res) => {
  try {
    const { sellerId } = req.params;
    const requires = await TrustEngine.requiresIntermediary(sellerId);
    res.json({ requiresIntermediary: requires });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
