export const JWT_SECRET = process.env.JWT_SECRET || 'local-campus-marketplace-secret-change-me';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

if (!process.env.JWT_SECRET) console.warn('[Security] JWT_SECRET is not configured; set a persistent secret before production deployment.');
