import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../backend/src/models/User.js';
import Product from '../backend/src/models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const dbUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_marketplace';

const DUMMY_IMAGES = [
  "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop", // Books
  "https://images.unsplash.com/photo-1511381939415-e1654145e0f6?w=800&auto=format&fit=crop", // Electronics
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop", // Clothes
  "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop", // Laptop
  "https://images.unsplash.com/photo-1550345332-09e3ac987658?w=800&auto=format&fit=crop", // Sneakers
  "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop", // Phone
];

const seedDB = async () => {
  try {
    console.log(`Connecting to: ${dbUri}`);
    await mongoose.connect(dbUri);
    console.log('Connected. Starting Seeding Process...');

    // 1. Create a Master Seed User (Admin)
    const adminUser = new User({
       email: 'curator@lpu.in',
       password: 'hashed_password_placeholder', // Usually we'd bcrypt this
       name: 'The Archive Curator',
       role: 'admin',
       status: 'verified',
       campusLocation: 'BH1',
       trustScore: 99,
       isTrustedSeller: true,
       totalTransactions: 150
    });
    const savedAdmin = await adminUser.save();
    console.log('Seed Admin created.');

    // 2. Clear existing products (optional, but good for fresh seed)
    await Product.deleteMany({});
    
    // 3. Generate High-Quality Dummy Products
    const dummyProducts = [
       {
          title: "MacBook Pro M2 - Space Grey",
          description: "Pristine condition. Battery health 98%. Used solely for coding and graphic design. Comes with original packaging.",
          price: 85000,
          category: "Electronics",
          condition: "Like_New",
          campusLocation: "BH1",
          images: [DUMMY_IMAGES[3], DUMMY_IMAGES[3], DUMMY_IMAGES[3]], // Requires 3
          seller: savedAdmin._id,
          isVerifiedProduct: true
       },
       {
          title: "Introduction to Algorithms (4th Ed)",
          description: "Essential for computer science students. Excellent condition, no highlighting or torn pages.",
          price: 1500,
          category: "Books",
          condition: "Good",
          campusLocation: "GH2",
          images: [DUMMY_IMAGES[0], DUMMY_IMAGES[0], DUMMY_IMAGES[0]],
          seller: savedAdmin._id,
          isVerifiedProduct: true
       },
       {
          title: "Vintage Denim Jacket",
          description: "Heavy patina, oversized fit. Sourced from a thrift archive. Excellent condition for its age.",
          price: 2500,
          category: "Apparel",
          condition: "Fair",
          campusLocation: "Apartments",
          images: [DUMMY_IMAGES[2], DUMMY_IMAGES[2], DUMMY_IMAGES[2]],
          seller: savedAdmin._id,
          isVerifiedProduct: false
       },
       {
          title: "Sony WH-1000XM5 Headphones",
          description: "Industry leading noise cancellation. Includes carrying case and all cables. Barely used.",
          price: 18000,
          category: "Electronics",
          condition: "New",
          campusLocation: "BH4",
          images: [DUMMY_IMAGES[1], DUMMY_IMAGES[1], DUMMY_IMAGES[1]],
          seller: savedAdmin._id,
          isVerifiedProduct: true
       },
       {
          title: "iPhone 13 Pro - Alpine Green",
          description: "Unlocked. Screen protector applied since day one. No scratches.",
          price: 45000,
          category: "Electronics",
          condition: "Like_New",
          campusLocation: "BH7",
          images: [DUMMY_IMAGES[5], DUMMY_IMAGES[5], DUMMY_IMAGES[5]],
          seller: savedAdmin._id,
          isVerifiedProduct: false
       },
       {
          title: "Minimalist White Sneakers (Size 10)",
          description: "Worn once indoors. Doesn't fit me. Extremely comfortable and versatile.",
          price: 3200,
          category: "Apparel",
          condition: "New",
          campusLocation: "Day Scholar",
          images: [DUMMY_IMAGES[4], DUMMY_IMAGES[4], DUMMY_IMAGES[4]],
          seller: savedAdmin._id,
          isVerifiedProduct: true
       }
    ];

    await Product.insertMany(dummyProducts);
    console.log(`Successfully injected ${dummyProducts.length} curated artifacts into The LPU Archive.`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedDB();
