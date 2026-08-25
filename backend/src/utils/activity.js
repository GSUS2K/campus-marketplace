import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';

export const audit = (actor, action, entityType, entityId = null, details = {}) => AuditLog.create({ actor, action, entityType, entityId, details }).catch((error) => console.warn('[Audit] Could not persist activity:', error.message));

export const notify = (recipient, type, title, body, link = '') => Notification.create({ recipient, type, title, body, link }).catch((error) => console.warn('[Notification] Could not persist notification:', error.message));
