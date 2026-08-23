import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './src/models/User.js';
import Product from './src/models/Product.js';
import Order from './src/models/Order.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const dbUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_marketplace';

const CATEGORY_IMAGES = {
  Books: [
    "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=1000&auto=format&fit=crop", // Open book minimal
    "https://images.unsplash.com/photo-1495640388908-05fa85288e61?q=80&w=1000&auto=format&fit=crop", // Stacked vintage books
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000&auto=format&fit=crop", // Book minimal composition
    "https://images.unsplash.com/photo-1610116306796-6fea9f4fae38?q=80&w=1000&auto=format&fit=crop"  // Architect book
  ],
  Electronics: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop", // Headphones minimal yellow
    "https://images.unsplash.com/photo-1526406915894-7bcd65f60845?q=80&w=1000&auto=format&fit=crop", // Retro speaker
    "https://images.unsplash.com/photo-1526509867162-5b0c0d1b4b33?q=80&w=1000&auto=format&fit=crop", // Leica camera
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1000&auto=format&fit=crop", // Macbook minimal
    "https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=1000&auto=format&fit=crop", // Teenage engineering synth
    "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?q=80&w=1000&auto=format&fit=crop"  // Mechanical keyboard
  ],
  Apparel: [
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop", // Leather jacket
    "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1000&auto=format&fit=crop", // Vintage boots
    "https://images.unsplash.com/photo-1434389678232-05f4222eb686?q=80&w=1000&auto=format&fit=crop", // Minimalist cap
    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1000&auto=format&fit=crop"  // Graphic tee minimal
  ],
  Miscellaneous: [
    "https://images.unsplash.com/photo-1508215885820-4585e56135c8?q=80&w=1000&auto=format&fit=crop", // Minimalist watch
    "https://images.unsplash.com/photo-1507646227500-4d389b0012be?q=80&w=1000&auto=format&fit=crop", // Silver lamp
    "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1000&auto=format&fit=crop", // Designer chair
    "https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=80&w=1000&auto=format&fit=crop"  // Brass pen
  ]
};

const CATEGORIES = ["Books", "Electronics", "Apparel", "Miscellaneous"];
const CONDITIONS = ["new", "like_new", "good", "fair", "poor", "needs_repair"];
const LOCATIONS = ['BH1', 'BH4', 'BH7', 'Day Scholar', 'GH1', 'Staff Residence'];

const ITEM_PREFIXES = ["Campus", "Study", "Studio", "Everyday", "Weekend"];
const ITEM_NOUNS = ["001", "002", "Alpha", "X", "Pro", "Vintage", "Modular"];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomPrice = () => Math.floor(Math.random() * 200) * 50 + 1500; // 1500 to 11500

const generateDescription = (title) => {
  return `${title}, lightly used and ready for a new campus owner. Clear condition notes, quick campus pickup, and a straightforward handover through LPU Marketplace.`;
};

const seedDB = async () => {
  try {
    console.log(`Connecting to: ${dbUri}`);
    await mongoose.connect(dbUri);
    
    // Only replace the demo namespace. Real user listings remain untouched.
    const demoEmails = ['admin@lpu.in', 'seller@lpu.in', 'buyer@lpu.in', 'ganesh.sivah2025@lpu.in'];
    const demoUsers = await User.find({ email: { $in: demoEmails } }).select('_id');
    const demoUserIds = demoUsers.map((user) => user._id);
    await Order.deleteMany({ $or: [{ buyer: { $in: demoUserIds } }, { 'items.seller': { $in: demoUserIds } }] });
    await Product.deleteMany({ seller: { $in: demoUserIds } });
    await User.deleteMany({ _id: { $in: demoUserIds } });
    
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password123', salt);

    // 1. Create Roles
    console.log("Creating Test Roles...");
    
    const adminUser = await new User({
       email: 'admin@lpu.in',
       password: defaultPassword,
       name: 'Maya Admin',
       role: 'admin',
       status: 'verified',
       campusLocation: 'BH1',
       trustScore: 99,
       isTrustedSeller: true,
       totalTransactions: 150
    }).save();

    const sellerUser = await new User({
       email: 'seller@lpu.in',
       password: defaultPassword,
       name: 'Aarav Seller',
       role: 'seller',
       status: 'verified',
       campusLocation: 'Day Scholar',
       trustScore: 85,
       isTrustedSeller: true,
       totalTransactions: 42
    }).save();

    const buyerUser = await new User({
       email: 'buyer@lpu.in',
       password: defaultPassword,
       name: 'Diya Buyer',
       role: 'buyer',
       status: 'verified',
       campusLocation: 'GH3',
       trustScore: 50,
       isTrustedSeller: false,
       totalTransactions: 2
    }).save();

    // Recreate the user's specific account
    const ganeshUser = await new User({
       email: 'ganesh.sivah2025@lpu.in',
       password: defaultPassword,
       name: 'Ganesh Sivah',
       role: 'seller', // Making you a seller so you can test consigning
       status: 'verified',
       campusLocation: 'BH1',
       trustScore: 90,
       isTrustedSeller: true,
       totalTransactions: 10
    }).save();

    console.log("Created demo accounts: admin@lpu.in, seller@lpu.in, buyer@lpu.in, ganesh.sivah2025@lpu.in (All passwords: password123)");

    // 2. Generate 30 Gallery Products
    console.log("Generating 30 campus listings...");
    const products = [];
    
    // We will ensure a good mix of 30 items
    for (let i = 0; i < 30; i++) {
       const category = CATEGORIES[i % CATEGORIES.length];
       const title = `${getRandom(ITEM_PREFIXES)} ${category === 'Electronics' ? 'Device' : category === 'Books' ? 'Tome' : category === 'Apparel' ? 'Garment' : 'Object'} — ${getRandom(ITEM_NOUNS)}`;
       const isVerified = i % 10 !== 0;
       
       const img1 = getRandom(CATEGORY_IMAGES[category]);
       const img2 = getRandom(CATEGORY_IMAGES[category]);
       
       products.push({
          title,
          description: generateDescription(title),
          price: getRandomPrice(),
          category,
          condition: getRandom(CONDITIONS),
          campusLocation: getRandom(LOCATIONS),
          images: [img1, img2],
          seller: [sellerUser._id, ganeshUser._id, sellerUser._id, adminUser._id][i % 4],
          isVerifiedProduct: isVerified,
          status: 'active'
       });
    }

    await Product.insertMany(products);
    const savedProducts = await Product.find({ seller: { $in: [sellerUser._id, ganeshUser._id] } }).sort({ createdAt: 1 }).limit(3);
    if (savedProducts.length >= 2) {
      await new Order({
        buyer: buyerUser._id,
        items: [{ product: savedProducts[0]._id, seller: savedProducts[0].seller, title: savedProducts[0].title, image: savedProducts[0].images[0], price: savedProducts[0].price, quantity: 1 }],
        total: savedProducts[0].price,
        status: 'confirmed',
        pickupLocation: 'Main Gate',
        buyerNote: 'Demo order for testing the buyer flow.'
      }).save();
      await new Order({
        buyer: buyerUser._id,
        items: [{ product: savedProducts[1]._id, seller: savedProducts[1].seller, title: savedProducts[1].title, image: savedProducts[1].images[0], price: savedProducts[1].price, quantity: 1 }],
        total: savedProducts[1].price,
        status: 'placed',
        pickupLocation: 'BH1 Common Room',
        buyerNote: 'Second demo order for seller dashboard testing.'
      }).save();
    }
    console.log(`Successfully injected ${products.length} campus listings and 2 demo orders.`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedDB();
