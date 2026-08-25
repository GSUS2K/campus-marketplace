import jsonwebtoken from 'jsonwebtoken';
import { JWT_SECRET } from '../config/auth.js';

const authMiddleware = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token') || req.header('Authorization')?.split(' ')[1];

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jsonwebtoken.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

export default authMiddleware;
