import express from 'express';
import bcrypt from 'bcrypt';
import jsonwebtoken from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import User from '../models/User.js';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.JWT_SECRET) console.warn('[Security] JWT_SECRET is not configured; sessions will reset on restart. Set a persistent secret in Render.');
const LPU_EMAIL = /^[^\s@]+@lpu\.in$/i;
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { msg: 'Too many authentication attempts. Try again later.' } });
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false, message: { msg: 'Too many OTP requests. Try again later.' } });

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
  return crypto.randomInt(100000, 1000000).toString();
};

const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');
const normalizeEmail = (email = '') => email.trim().toLowerCase();
const requireLpuEmail = (value) => LPU_EMAIL.test(normalizeEmail(value));

const sendMobileOTP = async (phone, otp) => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    throw new Error('Mobile verification is not configured. Add Twilio credentials first.');
  }
  const body = new URLSearchParams({ To: phone, From: TWILIO_FROM_NUMBER, Body: `Your LPU Marketplace verification code is ${otp}. It expires in 10 minutes.` });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, { method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (!response.ok) throw new Error('Mobile OTP provider rejected the request.');
};

const otpEmail = (email, otp) => ({
  to: email,
  subject: 'Verification PIN - Campus Marketplace',
  text: `Your One-Time Password for Campus Marketplace is: ${otp}. It will expire in 10 minutes.`,
  html: `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; text-align: center; border: 1px solid #eee;">
      <h2 style="color: #1C1C1C; font-weight: 300; letter-spacing: 2px;">IDENTITY CONFIRMATION</h2>
      <p style="color: #666; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Your secure Marketplace PIN is:</p>
      <h1 style="color: #C82A2A; font-size: 32px; letter-spacing: 8px;">${otp}</h1>
      <p style="color: #999; font-size: 10px;">Expires in 10 minutes. Do not share this code.</p>
    </div>
  `,
});

const sendWithResend = async (email, otp) => {
    const from = process.env.RESEND_FROM_EMAIL || 'Campus Marketplace <onboarding@resend.dev>';
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        ...otpEmail(email, otp),
      }),
    });
    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Resend rejected the email (${response.status}): ${details.slice(0, 300)}`);
    }
    console.log('Verification email dispatched through Resend.');
};

const sendWithGmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  await transporter.sendMail({
    from: `Campus Marketplace <${process.env.EMAIL_USER}>`,
    ...otpEmail(email, otp),
  });
  console.log('Verification email dispatched through Gmail fallback.');
};

/** Resend is preferred; Gmail keeps OTP delivery free while a domain is unavailable. */
const sendOTP = async (email, otp) => {
  const providers = [];
  if (process.env.RESEND_API_KEY) providers.push(['Resend', () => sendWithResend(email, otp)]);
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) providers.push(['Gmail', () => sendWithGmail(email, otp)]);
  if (!providers.length) throw new Error('Email verification is not configured.');

  let lastError;
  for (const [name, send] of providers) {
    try {
      await send();
      return;
    } catch (err) {
      lastError = err;
      console.warn(`[Auth] ${name} email delivery failed; trying the next provider.`);
    }
  }
  console.error('[Auth] All email providers failed:', lastError?.message);
  throw lastError || new Error('Email delivery failed.');
};


/**
 * POST /api/auth/register
 * Register a new user, issue OTP
 */
router.post('/register', authLimiter, [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').notEmpty().withMessage('Name is required')
], validate, async (req, res) => {
  try {
    const { password, name, campusLocation, role, phone } = req.body;
    const email = normalizeEmail(req.body.email);
    
    // STRICT ENFORCEMENT: Reject any email that is not @lpu.in
    if (!requireLpuEmail(email)) {
      return res.status(400).json({ msg: 'Registration strictly limited to @lpu.in domains.' });
    }

    let user = await User.findOne({ email });
    if (user && user.status === 'verified') {
      return res.status(400).json({ msg: 'User already verified' });
    }

    const unHashedOtp = generateOTP();
    if (!process.env.RESEND_API_KEY && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) return res.status(503).json({ msg: 'Email verification is not configured yet.' });

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
        phone: phone || undefined,
        phoneVerified: !phone,
        otp: hashOtp(unHashedOtp),
        otpExpires: Date.now() + 10 * 60 * 1000 // 10 mins
      });
    } else {
      // Allow re-trying OTP if user exists but isn't verified
      user.otp = hashOtp(unHashedOtp);
      user.otpExpires = Date.now() + 10 * 60 * 1000;
      if (phone) user.phone = phone;
    }

    await user.save();
    
    // Dispatch Email asynchronously
    await sendOTP(user.email, unHashedOtp);

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
router.post('/verify-otp', otpLimiter, [
  body('email').isEmail().withMessage('Valid email required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid 6 digit pin required')
], validate, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { otp } = req.body;
    if (!requireLpuEmail(email)) return res.status(400).json({ msg: 'Only @lpu.in accounts can be verified.' });
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ msg: 'User not found' });
    if (user.status === 'verified') return res.status(400).json({ msg: 'Account already verified' });
    
    if (!user.otp || user.otp !== hashOtp(otp) || user.otpExpires < Date.now()) {
      return res.status(400).json({ msg: 'OTP is invalid or has expired.' });
    }

    // Pass
    user.status = user.role === 'seller' ? 'review' : 'verified';
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    if (user.phone && !user.phoneVerified) {
      return res.json({ requiresMobileVerification: true, email: user.email, phone: user.phone });
    }

    if (user.role === 'seller') return res.json({ sellerApprovalRequired: true, email: user.email });

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
router.post('/login', authLimiter, [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').exists().withMessage('Password is required')
], validate, async (req, res) => {
  try {
     const email = normalizeEmail(req.body.email);
     const { password } = req.body;
     if (!requireLpuEmail(email)) return res.status(400).json({ msg: 'Only verified @lpu.in accounts can access the marketplace.' });
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
        return res.status(403).json({ msg: 'Account requires email verification.' });
     }
     if (user.role === 'seller' && user.status !== 'verified') {
        return res.status(403).json({ msg: 'Seller access is awaiting admin approval.', sellerApprovalRequired: true });
     }

     if (user.phone && !user.phoneVerified) {
        return res.status(403).json({ msg: 'Mobile verification required.', requiresMobileVerification: true });
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
router.post('/password/request', otpLimiter, [
  body('email').isEmail().withMessage('Valid email required')
], validate, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!requireLpuEmail(email)) return res.status(400).json({ msg: 'Only @lpu.in accounts can reset access.' });
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'Account not found' });
    }

    const unHashedOtp = generateOTP();
    user.otp = hashOtp(unHashedOtp);
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendOTP(user.email, unHashedOtp);
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
router.put('/password/reset', otpLimiter, [
  body('email').isEmail().withMessage('Valid email required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid 6 digit pin required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], validate, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { otp, newPassword } = req.body;
    if (!requireLpuEmail(email)) return res.status(400).json({ msg: 'Only @lpu.in accounts can reset access.' });
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ msg: 'Account not found' });
    // Prevent suspended/rejected users from regaining access via password reset
    if (user.status === 'rejected') {
      return res.status(403).json({ msg: 'Account suspended. Contact administrator.' });
    }
    if (!user.otp || user.otp !== hashOtp(otp) || user.otpExpires < Date.now()) {
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

router.post('/mobile/request', otpLimiter, [body('email').isEmail().withMessage('Valid LPU email required')], validate, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!requireLpuEmail(email)) return res.status(400).json({ msg: 'Only @lpu.in accounts can use mobile verification.' });
    const user = await User.findOne({ email });
    if (!user || !user.phone) return res.status(404).json({ msg: 'No mobile number is attached to this account.' });
    const otp = generateOTP();
    user.mobileOtpHash = hashOtp(otp);
    user.mobileOtpExpires = Date.now() + 10 * 60 * 1000;
    user.mobileOtpAttempts = 0;
    await user.save();
    await sendMobileOTP(user.phone, otp);
    res.json({ msg: 'Mobile verification code sent.' });
  } catch (err) {
    console.error('[Auth] mobile OTP request failed:', err.message);
    res.status(503).json({ msg: err.message });
  }
});

router.post('/mobile/verify', otpLimiter, [body('email').isEmail(), body('otp').isLength({ min: 6, max: 6 })], validate, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });
    if (!user || !user.mobileOtpHash || user.mobileOtpExpires < Date.now()) return res.status(400).json({ msg: 'Mobile code is invalid or expired.' });
    if (user.mobileOtpAttempts >= 5) return res.status(429).json({ msg: 'Too many incorrect mobile codes.' });
    user.mobileOtpAttempts += 1;
    if (user.mobileOtpHash !== hashOtp(req.body.otp)) { await user.save(); return res.status(400).json({ msg: 'Mobile code is invalid.' }); }
    user.phoneVerified = true; user.mobileOtpHash = null; user.mobileOtpExpires = null; user.mobileOtpAttempts = 0; await user.save();
    if (user.role === 'seller' && user.status !== 'verified') return res.json({ sellerApprovalRequired: true, email: user.email });
    const payload = { user: { id: user.id, role: user.role, trustScore: user.trustScore, isVerified: true } };
    const token = jsonwebtoken.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, campusLocation: user.campusLocation, trustScore: user.trustScore, isTrustedSeller: user.isTrustedSeller, status: user.status } });
  } catch (err) { console.error('[Auth] mobile OTP verification failed:', err.message); res.status(500).json({ msg: 'Could not verify mobile number.' }); }
});

export default router;
