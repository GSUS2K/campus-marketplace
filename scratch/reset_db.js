import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const dbUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_marketplace';

const resetDB = async () => {
  try {
    console.log(`Attempting to connect to: ${dbUri}`);
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB.');

    // Drop the entire database
    await mongoose.connection.db.dropDatabase();
    console.log('Database "campus_marketplace" has been reset (dropped).');

    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
};

resetDB();
