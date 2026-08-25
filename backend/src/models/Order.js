import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  image: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, default: 1 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: { type: [orderItemSchema], required: true },
  total: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['placed', 'confirmed', 'ready', 'completed', 'cancelled'],
    default: 'placed',
    index: true
  },
  paymentMethod: { type: String, enum: ['test'], default: 'test' },
  paymentStatus: { type: String, enum: ['paid', 'refunded'], default: 'paid' },
  pickupLocation: { type: String, default: 'Main Gate' },
  pickupSlot: { type: String, trim: true, default: '' },
  handoverCode: { type: String, required: true, select: false },
  buyerConfirmedAt: { type: Date, default: null },
  sellerConfirmedAt: { type: Date, default: null },
  handoverConfirmedAt: { type: Date, default: null },
  buyerNote: { type: String, trim: true, maxlength: 300, default: '' }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
