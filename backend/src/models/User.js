import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String, // Hashed by bcrypt
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    default: 'buyer'
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'review'],
    default: 'pending' // Usually requires verification layer like institutional email checking
  },
  campusLocation: {
    type: String, // e.g., 'Hostel A', 'North Campus'
    trim: true
  },
  
  // OTP Verification System
  otp: {
    type: String,
    default: null
  },
  otpExpires: {
    type: Date,
    default: null
  },
  
  // TRMS (Trust and Reputation Management System) Details
  trustScore: {
    type: Number,
    default: 50, // Starts at a neutral threshold
    min: 0,
    max: 100
  },
  totalTransactions: {
    type: Number,
    default: 0
  },
  successfulTransactions: {
    type: Number,
    default: 0
  },
  averageResponseTimeInMinutes: {
    type: Number,
    default: -1 // -1 means no data yet
  },
  feedbackScore: {
    type: Number,
    default: 0 // Accumulative weighted feedback metric
  },
  isTrustedSeller: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
