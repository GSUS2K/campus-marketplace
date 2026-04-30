import User from '../models/User.js';

/**
 * Trust & Reputation Management System (TRMS) Service
 * Calculates dynamic trust scores and handles intermediary routing.
 */
class TrustEngine {
  constructor() {
    this.TRUST_THRESHOLD = 70; // Minimum score to avoid admin intermediary
    this.MAX_SCORE = 100;
  }

  /**
   * Recalculates user trust score based on new transaction/feedback
   * Weighs successful transactions, feedback score, and response times.
   */
  async recalculateTrustScore(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      // Simplistic TRMS algorithm implementation for dissertation proof-of-concept
      // Base score = 50. 
      // Successful transactions increase it slightly.
      // Positive feedback has the highest impact.
      // High response times degrade the score.
      
      let newScore = 50 
        + (user.successfulTransactions * 0.5) 
        + (user.feedbackScore * 2);

      // Penalize for slow response times (assuming > 60 mins is bad)
      if (user.averageResponseTimeInMinutes > 60) {
        newScore -= 5;
      }

      // Bound the score between 0 and 100
      newScore = Math.max(0, Math.min(newScore, this.MAX_SCORE));
      
      user.trustScore = Math.round(newScore);
      
      // Auto-assign trusted seller badge
      user.isTrustedSeller = user.trustScore >= 85;

      await user.save();
      return user.trustScore;

    } catch (err) {
      console.error('[TrustEngine] Error recalculating score:', err);
    }
  }

  /**
   * Evaluates if a chat requires an admin intermediary
   */
  async requiresIntermediary(sellerId) {
    try {
      const seller = await User.findById(sellerId);
      if (!seller) return true; // Fail safe
      return seller.trustScore < this.TRUST_THRESHOLD;
    } catch (err) {
      console.error('[TrustEngine] Error evaluating intermediary:', err);
      return true; // Default to safety
    }
  }
}

export default new TrustEngine();
