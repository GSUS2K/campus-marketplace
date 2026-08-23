import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';
import User from '../models/User.js';
import AnalyticsEngine from '../services/AnalyticsEngine.js';
import auth from '../middleware/auth.js';
import fs from 'fs';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads/');
fs.mkdirSync(uploadsDir, { recursive: true });


// ---------------------------------------------------------
// MULTER CONFIGURATION FOR LOCAL UPLOADS
// ---------------------------------------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Absolute path — safe regardless of CWD when Node is invoked
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per image
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload only images.'), false);
    }
  }
});

// ---------------------------------------------------------
// ROUTES
// ---------------------------------------------------------

/**
 * GET /api/products
 * Fetch all products (discovery feed) - Public Access
 */
router.get('/', async (req, res) => {
   try {
      const { category, location, limit = 200 } = req.query;
      let query = { status: 'active', isVerifiedProduct: true };

      if (category) query.category = category;
      if (location) {
         query.campusLocation = location;
         AnalyticsEngine.trackSearch(location, category || 'all', null);
      }

      const products = await Product.find(query)
         .populate('seller', ['name', 'trustScore', 'isTrustedSeller', 'status'])
         .sort({ createdAt: -1 })
         .limit(parseInt(limit));

      // Append absolute URL to image paths so the frontend can load them
      const baseUrl = req.protocol + '://' + req.get('host');
      const mappedProducts = products.map(p => {
         const pObj = p.toObject();
         pObj.images = pObj.images.map(img => img.startsWith('http') ? img : `${baseUrl}/${img}`);
         return pObj;
      });

      res.json(mappedProducts);
   } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
   }
});

/**
 * GET /api/products/me
 * Fetch products listed by the currently authenticated user
 */
router.get('/me', auth, async (req, res) => {
  try {
     const products = await Product.find({ seller: req.user.id })
        .sort({ createdAt: -1 });

     const baseUrl = req.protocol + '://' + req.get('host');
     const mappedProducts = products.map(p => {
        const pObj = p.toObject();
        pObj.images = pObj.images.map(img => img.startsWith('http') ? img : `${baseUrl}/${img}`);
        return pObj;
     });

     res.json(mappedProducts);
  } catch (err) {
     console.error(err.message);
     res.status(500).send('Server Error');
  }
});

/**
 * GET /api/products/admin/pending
 * ADMIN ONLY: Fetch products that require verification
 */
router.get('/admin/pending', auth, async (req, res) => {
  try {
     // Check if user exists and is admin
     const user = await User.findById(req.user.id);
     if (!user) {
        return res.status(403).json({ msg: 'Session expired. Please re-authenticate.' });
     }
     if (user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied. Administrative privileges required.' });
     }

     const products = await Product.find({ isVerifiedProduct: false, status: { $in: ['pending_review', 'active'] } })
        .populate('seller', ['name', 'email'])
        .sort({ createdAt: 1 });

     const baseUrl = req.protocol + '://' + req.get('host');
     const mappedProducts = products.map(p => {
        const pObj = p.toObject();
        pObj.images = pObj.images.map(img => img.startsWith('http') ? img : `${baseUrl}/${img}`);
        return pObj;
     });

     res.json(mappedProducts);
  } catch (err) {
     console.error(err.message);
     res.status(500).send('Server Error');
  }
});

/**
 * PUT /api/products/admin/verify/:id
 * ADMIN ONLY: Verify a specific product
 */
router.put('/admin/verify/:id', auth, async (req, res) => {
  try {
     const user = await User.findById(req.user.id);
     if (user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied.' });
     }

     const product = await Product.findById(req.params.id);
     if (!product) return res.status(404).json({ msg: 'Product not found' });

     product.isVerifiedProduct = true;
     product.status = 'active';
     await product.save();

     res.json({ msg: 'Product successfully verified.', product });
  } catch (err) {
     console.error(err.message);
     res.status(500).send('Server Error');
  }
});

/**
 * PUT /api/products/admin/flag/:id
 * ADMIN ONLY: Flag a product as anomalous/rejected
 */
router.put('/admin/flag/:id', auth, async (req, res) => {
  try {
     const user = await User.findById(req.user.id);
     if (user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied.' });
     }

     const product = await Product.findById(req.params.id);
     if (!product) return res.status(404).json({ msg: 'Product not found' });

     product.status = 'flagged';
     await product.save();

     res.json({ msg: 'Product has been flagged and removed from active queue.', product });
  } catch (err) {
     console.error(err.message);
     res.status(500).send('Server Error');
  }
});


/**
 * GET /api/products/:id
 */
router.get('/:id', async (req, res) => {
   try {
      const product = await Product.findById(req.params.id)
         .populate('seller', ['name', 'trustScore', 'isTrustedSeller', 'averageResponseTimeInMinutes']);
      
      if (!product) return res.status(404).json({ msg: 'Product not found' });

      AnalyticsEngine.trackView(product._id, null, product.campusLocation);

      const baseUrl = req.protocol + '://' + req.get('host');
      const pObj = product.toObject();
      pObj.images = pObj.images.map(img => img.startsWith('http') ? img : `${baseUrl}/${img}`);

      res.json(pObj);
   } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Product not found' });
      res.status(500).send('Server Error');
   }
});

/**
 * POST /api/products
 * Create a new listing with Multer image uploads
 */
router.post('/', auth, upload.array('images', 10), async (req, res) => {
   try {
      // 1. Mandatory 3 Image Check
      if (!req.files || req.files.length < 3) {
         return res.status(400).json({ msg: 'Please add at least 3 images so buyers can inspect the listing.' });
      }

      const { title, description, price, category, condition, campusLocation } = req.body;
      const riskLevel = price > 5000 ? 'high' : price > 1500 ? 'medium' : 'low';

      // Extract file paths from Multer payload
      const imagePaths = req.files.map(file => `uploads/${file.filename}`);

      const newProduct = new Product({
         title,
         description,
         price,
         category,
         condition,
         campusLocation,
         images: imagePaths, // Storing physical paths
         riskLevel,
         seller: req.user.id,
         status: 'pending_review'
      });

      const product = await newProduct.save();
      res.json(product);

   } catch (err) {
      console.error(err.message);
      res.status(500).send(err.message || 'Server Error');
   }
});

/**
 * DELETE /api/products/:id
 * Delete a product listing (Owner or Admin)
 */
router.delete('/:id', auth, async (req, res) => {
   try {
      const product = await Product.findById(req.params.id);
      
      if (!product) {
         return res.status(404).json({ msg: 'Product not found' });
      }

      // Check user authorization (must be seller or admin)
      const user = await User.findById(req.user.id);
      if (product.seller.toString() !== req.user.id && user.role !== 'admin') {
         return res.status(401).json({ msg: 'You are not authorized to delete this listing.' });
      }

      await product.deleteOne();
      res.json({ msg: 'Listing removed.' });
   } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Product not found' });
      res.status(500).send('Server Error');
   }
});

export default router;
