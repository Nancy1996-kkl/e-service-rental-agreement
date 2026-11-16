import { env } from '../config/env.js';

// 🔒 CSRF protection — vera website (e.g. evil.com) user-oda login cookie vechu
// namma API-ku request anuppa try pannaa block pannrom.
// Browser ellaa POST/PUT/DELETE requests-layum "Origin" header anuppum — adha check pannrom.

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function blockCrossSiteRequests(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.get('origin');
  if (!origin) return next(); // Browser illaadha tools (curl, scripts) — avangakitta user cookie irukkaadhu

  const allowed = new Set([new URL(env.clientUrl).origin]);
  // Production-la frontend & API orey domain-la irundha
  if (req.get('host')) allowed.add(`${req.protocol}://${req.get('host')}`);

  if (!allowed.has(origin)) {
    return res.status(403).json({ message: 'Request blocked (cross-site)' });
  }
  next();
}
