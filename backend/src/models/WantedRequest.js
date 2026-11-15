import mongoose from 'mongoose';

const wantedRequestSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  category: { type: String, enum: ['Books', 'Electronics', 'Apparel', 'Miscellaneous'], required: true },
  budget: { type: Number, required: true, min: 0, max: 100000 },
  campusLocation: { type: String, required: true, trim: true },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['open', 'fulfilled', 'closed'], default: 'open', index: true }
}, { timestamps: true });

export default mongoose.model('WantedRequest', wantedRequestSchema);
