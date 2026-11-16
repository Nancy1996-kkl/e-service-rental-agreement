import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import agreementRoutes from './routes/agreementRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { requireAuth } from './middleware/auth.js';
import { blockCrossSiteRequests } from './middleware/csrf.js';
import { listClauses } from './services/clauseService.js';

const app = express();

// Production-la Render / Nginx maadhiri proxy pinnaadi run aagum — real user IP edukka (rate limit-ku)
if (env.isProduction) app.set('trust proxy', 1);
app.disable('x-powered-by');

// Security headers automatic-ah add pannum
app.use(helmet());

// Namma frontend mattum dhaan API call panna mudiyum. credentials: true → cookie anuppa allow
app.use(cors({ origin: env.clientUrl, credentials: true }));

// JSON body & cookies read panna
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// 🔒 Vera website-la irundhu namma API-ku form/request anuppa mudiyaadhu (CSRF protection)
app.use('/api', blockCrossSiteRequests);

// Oru IP-la irundhu 15 min-ku max 1000 requests — spam/attack thadukka
// (auto-save adikkadi call aagum, adhanaala konjam adhigama vechirukkom)
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000 }));

// Health check — server ok-ah nu test panna
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server running 🚀', storage: env.storage });
});

// ===== API routes =====
app.use('/api/auth', authRoutes);
app.use('/api/agreements', agreementRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/admin', adminRoutes);

// Active standard clauses — preview-la document-la kaatta (login pannavanga)
app.get('/api/clauses', requireAuth, async (req, res) => {
  const clauses = await listClauses({ activeOnly: true });
  res.json({ clauses: clauses.map(({ id, title, text, templates }) => ({ id, title, text, templates })) });
});

// API-la theriyaadha URL-ku 404
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ===== Production: React build-ah idhe server serve pannum (oru server, oru URL) =====
const CLIENT_DIST = fileURLToPath(new URL('../../client/dist', import.meta.url));
if (env.isProduction && existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST, { index: false, maxAge: '7d' }));
  // React Router pages (/dashboard, /admin ...) — ellaam index.html
  app.get(/.*/, (req, res) => res.sendFile('index.html', { root: CLIENT_DIST, maxAge: 0 }));
}

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Edhavadhu error vandha — user-ku safe message mattum anuppuvom
app.use((err, req, res, next) => {
  // Thappaana JSON body anuppina
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid request body' });
  }
  if (!env.isTest || !err.status) console.error(err);
  res.status(err.status || 500).json({ message: err.status ? err.message : 'Something went wrong' });
});

export default app;
