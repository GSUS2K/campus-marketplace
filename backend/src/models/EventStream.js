import mongoose from 'mongoose';

/**
 * EventStream Database Engine
 * A lightweight persistent layer meant to mimic Kafka topics.
 * Used for storing historical metrics for PowerBI data analysis
 * (e.g. clickstreams, demand surges, search telemetry).
 */
const eventStreamSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: ['VIEW', 'SEARCH', 'CHAT_INITIATED', 'TRANSACTION_COMPLETE', 'FRAUD_FLAG'],
    required: true,
    index: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId, // Could be ProductId, UserId
    index: true
  },
  targetType: {
    type: String,
    enum: ['Product', 'User', 'System'],
    default: 'Product'
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed // JSON payload for flexibility
    // e.g. { location: 'Hostel A', searchTokens: 'books', priceRange: [10, 50] }
  },
  timestamp: {
    type: Date,
    default: Date.now,
    expires: '90d' // Automatically cleanup events older than 90 days to keep the system lightweight
  }
});

// Compound index for querying events by type in a particular time range
eventStreamSchema.index({ eventType: 1, timestamp: -1 });

export default mongoose.model('EventStream', eventStreamSchema);
