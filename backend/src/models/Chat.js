import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminIntermediary: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Assigned if Intermediary is active
  },
  isIntermediaryActive: {
    type: Boolean,
    default: false // Activated if seller trustScore < threshold or user requests mediation
  },
  status: {
    type: String,
    enum: ['open', 'negotiating', 'agreed', 'closed'],
    default: 'open'
  },
  agreedPrice: {
    type: Number,
    default: null
  }
}, { timestamps: true });

export default mongoose.model('Chat', chatSchema);
