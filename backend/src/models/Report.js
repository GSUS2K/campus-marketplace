import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  targetType: { type: String, enum: ['Product', 'User', 'Order', 'Chat'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, enum: ['fraud', 'unsafe_meetup', 'misleading_listing', 'harassment', 'counterfeit', 'other'], required: true },
  details: { type: String, trim: true, maxlength: 1000, default: '' },
  status: { type: String, enum: ['open', 'in_review', 'resolved', 'dismissed'], default: 'open', index: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolution: { type: String, trim: true, maxlength: 1000, default: '' }
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);
