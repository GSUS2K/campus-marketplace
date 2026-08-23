import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    index: true // Indexed for fast queries and analytics
  },
  condition: {
    type: String,
    enum: ['new', 'like_new', 'good', 'fair', 'poor', 'needs_repair'],
    default: 'good'
  },
  images: [{
    type: String // URLs to Cloudinary or similar
  }],
  status: {
    type: String,
    enum: ['pending_review', 'active', 'reserved', 'sold', 'hidden', 'flagged'],
    default: 'pending_review'
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campusLocation: {
    type: String,
    required: true,
    index: true // For area-based trend heatmaps
  },

  // Trust & Verification
  isVerifiedProduct: {
    type: Boolean,
    default: false
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  
  // Real-time Analytics Tracking
  lifetimeViews: {
    type: Number,
    default: 0
  },
  lifetimeSearches: {
    type: Number, // Tracked when users search for items and this comes up in results and gets clicked
    default: 0
  },
  demandScore: { // Calculated based on views/sec algorithm and updated periodically
    type: Number, 
    default: 0,
    index: true // Indexed to easily query trending/hot products
  },
  reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reservedUntil: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
