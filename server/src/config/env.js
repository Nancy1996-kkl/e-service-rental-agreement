// .env values-ah oru idathula read panni check pannrom.
// Mukkiyamana value missing-na server start aagaadhu — late-ah confuse aagaama irukka.

import path from 'node:path';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET.startsWith('change_this')) {
  if (isProduction) {
    throw new Error('JWT_SECRET must be set to a long random value (min 32 characters) in .env');
  }
  if (!isTest) console.warn('⚠️  JWT_SECRET is weak or missing. Set a long random value in server/.env');
}

// Storage: "local" (server/data + server/storage folders) or "google" (Google Sheet + Drive)
const STORAGE = (process.env.STORAGE || 'local').toLowerCase();
if (!['local', 'google'].includes(STORAGE)) throw new Error('STORAGE must be "local" or "google"');

if (STORAGE === 'google') {
  const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN', 'GOOGLE_SHEET_ID', 'GOOGLE_DRIVE_FOLDER_ID'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`STORAGE=google needs these in server/.env: ${missing.join(', ')}. See DEPLOYMENT.md → Google setup.`);
  }
}

export const env = {
  isProduction,
  isTest,
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  // Dev-la weak secret irundhaalum run aaganum; production-la mela throw aagidum
  jwtSecret: JWT_SECRET || 'dev-only-insecure-secret-change-me-please-0000',
  jwtExpiresIn: '7d',

  storage: STORAGE,
  dataDir: path.resolve(process.env.DATA_DIR || 'data'), // local JSON files
  filesDir: path.resolve(process.env.FILES_DIR || 'storage'), // local encrypted files & generated documents

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    sheetId: process.env.GOOGLE_SHEET_ID,
    driveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
  },
};
