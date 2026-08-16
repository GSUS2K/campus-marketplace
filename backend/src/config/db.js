import mongoose from 'mongoose';

mongoose.set('bufferCommands', false);

let retryTimer = null;

const connectDB = async () => {
  try {
    const dbUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_marketplace';
    const conn = await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    if (retryTimer) {
      clearInterval(retryTimer);
      retryTimer = null;
    }
    return true;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    if (!retryTimer) {
      retryTimer = setInterval(() => connectDB(), 15000);
    }
    return false;
  }
};

export default connectDB;
