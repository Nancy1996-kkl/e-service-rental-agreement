// 🔒 Aadhaar files-ah encrypt / decrypt pannradhu (AES-256-GCM).
//
// Encrypt pannina file-ah yaaravadhu thiruditaalum, key illama open panna mudiyaadhu.
// GCM = file-ah yaaravadhu maathinaalum (tamper) kandupidikkum.
//
// Key: server/.env-la FILE_ENCRYPTION_KEY (64 hex characters = 32 bytes).
// ⚠️ Key-ah maathinaa / tholachitta, pazhaya files open aagaadhu. Key-ah safe-ah backup pannunga.

import crypto from 'node:crypto';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import { saveFile, readFile, deleteFile } from '../storage/index.js';

const ALGORITHM = 'aes-256-gcm';
const DEV_KEY_FILE = path.join(env.dataDir, '.dev-file-key');

function loadKey() {
  const fromEnv = process.env.FILE_ENCRYPTION_KEY;
  if (fromEnv) {
    if (!/^[0-9a-f]{64}$/i.test(fromEnv)) {
      throw new Error('FILE_ENCRYPTION_KEY must be 64 hex characters. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    }
    return Buffer.from(fromEnv, 'hex');
  }

  if (env.isProduction) throw new Error('FILE_ENCRYPTION_KEY is required in production (server/.env)');

  // Development-la .env-la key illana: oru dhadava random key create panni data/ folder-la vechukkrom
  if (!existsSync(DEV_KEY_FILE)) {
    mkdirSync(path.dirname(DEV_KEY_FILE), { recursive: true });
    writeFileSync(DEV_KEY_FILE, crypto.randomBytes(32).toString('hex'));
    console.warn('⚠️  FILE_ENCRYPTION_KEY not set — created a development key in data/.dev-file-key');
  }
  return Buffer.from(readFileSync(DEV_KEY_FILE, 'utf8').trim(), 'hex');
}

const KEY = loadKey();

/** buffer → { encrypted, iv, authTag } */
export function encrypt(buffer) {
  const iv = crypto.randomBytes(12); // Ovvoru file-kum pudhu random IV
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return { encrypted, iv: iv.toString('hex'), authTag: cipher.getAuthTag().toString('hex') };
}

/** Encrypted buffer → original buffer (file maathirundha error throw aagum) */
export function decrypt(encrypted, ivHex, authTagHex) {
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

// ===== Encrypted files (local storage/ folder or Google Drive — storage/index.js) =====
const keyFor = (storageKey) => `uploads/${storageKey}.enc`;

export async function saveEncryptedFile(storageKey, encrypted) {
  await saveFile(keyFor(storageKey), encrypted);
}

export async function readEncryptedFile(storageKey) {
  return readFile(keyFor(storageKey));
}

export async function deleteEncryptedFile(storageKey) {
  await deleteFile(keyFor(storageKey)).catch(() => {});
}
