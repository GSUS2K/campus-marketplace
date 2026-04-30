import express from 'express';
import bcrypt from 'bcrypt';
import jsonwebtoken from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import User from '../models/User.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dissertation_super_secret_key_2026';

/**
 * Handle validation errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * Generate a randomized 6 digit OTP string
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Configures NodeMailer for actual Email Delivery
 */
const sendOTP = async (email, otp) => {
  try {
    /* 
    // OLD ETHEREAL MOCK CODE (Commented as requested)
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    */

    // NEW PRODUCTION GMAIL SMTP CODE
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // e.g. your_throwaway@gmail.com
        pass: process.env.EMAIL_PASS, // 16-character Google App Password
      },
    });

    const info = await transporter.sendMail({
      from: `"Campus Market TRMS" <${process.env.EMAIL_USER}>`,
      to: email, // Sending to the actual LPU email
      subject: "Verification PIN - Campus Marketplace",
      text: `Your One-Time Password for Market Access is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; text-align: center; border: 1px solid #eee;">
          <h2 style="color: #1C1C1C; font-weight: 300; letter-spacing: 2px;">IDENTITY CONFIRMATION</h2>
          <p style="color: #666; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Your secure Market PIN is:</p>
          <h1 style="color: #C82A2A; font-size: 32px; letter-spacing: 8px;">${otp}</h1>
          <p style="color: #999; font-size: 10px;">Expires in 10 minutes. Do not share this code.</p>
        </div>
      `,
    });

    console.log("Real Email dispatched to: %s", email);
  } catch (err) {
    console.error("Failed to send Actual OTP via Nodemailer. Did you set up the .env?", err);
  }
};


/**
 * POST /api/auth/register
 * Register a new user, issue OTP
 */
router.post('/register', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required')
], validate, async (req, res) => {
  try {
    const { email, password, name, campusLocation, role } = req.body;
    
    // STRICT ENFORCEMENT: Reject any email that is not @lpu.in
    if (!email.endsWith('@lpu.in')) {
      return res.status(400).json({ msg: 'Registration strictly limited to @lpu.in domains.' });
    }

    let user = await User.findOne({ email });
    if (user && user.status === 'verified') {
      return res.status(400).json({ msg: 'User already verified' });
    }

    const unHashedOtp = generateOTP();

    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = new User({
        email,
        password: hashedPassword,
        name,
        campusLocation: campusLocation || 'Day Scholar',
        role: ['buyer', 'seller'].includes(role) ? role : 'buyer',
        status: 'pending',
        otp: unHashedOtp,
        otpExpires: Date.now() + 10 * 60 * 1000 // 10 mins
      });
    } else {
      // Allow re-trying OTP if user exists but isn't verified
      user.otp = unHashedOtp;
      user.otpExpires = Date.now() + 10 * 60 * 1000;
    }

    await user.save();
    
    // Dispatch Email asynchronously
    sendOTP(user.email, unHashedOtp);

    res.status(201).json({ msg: 'Registration accepted. OTP Dispatched.', email: user.email });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


/**
 * POST /api/auth/verify-otp
 * Verifies OTP and returns secure JWT
 */
router.post('/verify-otp', [
  body('email').isEmail().withMessage('Valid email required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid 6 digit pin required')
], validate, async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ msg: 'User not found' });
    if (user.status === 'verified') return res.status(400).json({ msg: 'Account already verified' });
    
    if (!user.otp || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ msg: 'OTP is invalid or has expired.' });
    }

    // Pass
    user.status = 'verified';
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        trustScore: user.trustScore,
        isVerified: true
      }
    };

    jsonwebtoken.sign(
      payload, 
      JWT_SECRET, 
      { expiresIn: '24h' }, 
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token, 
          user: { 
            id: user.id, 
            name: user.name, 
            email: user.email,
            role: user.role,
            campusLocation: user.campusLocation,
            trustScore: user.trustScore,
            isTrustedSeller: user.isTrustedSeller,
            status: user.status
          } 
        });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


/**
 * POST /api/auth/login
 * Authenticate User & Get Token
 */
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').exists().withMessage('Password is required')
], validate, async (req, res) => {
  try {
     const { email, password } = req.body;
     const user = await User.findOne({ email });
     
     if (!user) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
     }

     const isMatch = await bcrypt.compare(password, user.password);
     if (!isMatch) {
         return res.status(400).json({ msg: 'Invalid Credentials' });
     }

     if (user.status === 'rejected') {
        return res.status(403).json({ msg: 'Account suspended/rejected' });
     }
     
     // Gate: Enforce verified status
     if (user.status === 'pending') {
        return res.status(403).json({ msg: 'Account requires OTP verification. Check terminal/email.' });
     }

     const payload = {
        user: {
           id: user.id,
           role: user.role,
           trustScore: user.trustScore,
           isVerified: true
        }
     };

     jsonwebtoken.sign(
        payload, 
        JWT_SECRET, 
        { expiresIn: '24h' }, 
        (err, token) => {
          if (err) throw err;
          res.json({ 
            token, 
            user: { 
              id: user.id, 
              name: user.name, 
              email: user.email,
              role: user.role,
              campusLocation: user.campusLocation,
              trustScore: user.trustScore,
              isTrustedSeller: user.isTrustedSeller,
              status: user.status
            } 
          });
        }
    );

  } catch (err) {
     console.error(err.message);
     res.status(500).send('Server Error');
  }
});

/**
 * POST /api/auth/password/request
 * Send OTP for password reset
 */
router.post('/password/request', [
  body('email').isEmail().withMessage('Valid email required')
], validate, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'Account not found' });
    }

    const unHashedOtp = generateOTP();
    user.otp = unHashedOtp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    sendOTP(user.email, unHashedOtp);
    res.json({ msg: 'Reset PIN dispatched to email.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * PUT /api/auth/password/reset
 * Verify OTP and set new password
 */
router.put('/password/reset', [
  body('email').isEmail().withMessage('Valid email required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid 6 digit pin required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], validate, async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ msg: 'Account not found' });
    // Prevent suspended/rejected users from regaining access via password reset
    if (user.status === 'rejected') {
      return res.status(403).json({ msg: 'Account suspended. Contact administrator.' });
    }
    if (!user.otp || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ msg: 'Reset PIN is invalid or has expired.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ msg: 'Password successfully updated. You may now log in.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
