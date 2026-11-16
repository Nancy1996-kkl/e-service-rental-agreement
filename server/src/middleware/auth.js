import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { findUserById } from '../services/userService.js';

// Login pannavanga mattum dhaan pogalaam — illana 401.
// Token valid-ah irundhaalum, admin andha user-ah disable pannirundha ulla vida maattom.
export async function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Please log in to continue' });

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }

  const user = await findUserById(payload.sub);
  if (!user) return res.status(401).json({ message: 'Session expired. Please log in again.' });
  if (user.isActive === false) {
    res.clearCookie('token');
    return res.status(403).json({ message: 'Your account has been disabled. Please contact support.' });
  }

  // Role database-la irundhu (admin promote / demote udane apply aaga)
  req.user = { id: user.id, role: user.role, email: user.email };
  next();
}

// Specific role mattum (e.g. admin). requireAuth-ku apram use pannanum.
// Usage: router.get('/x', requireAuth, requireRole('admin'), handler)
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to do this' });
    }
    next();
  };
}
