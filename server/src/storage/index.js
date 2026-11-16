// ⭐ Storage switch — server/.env-la STORAGE=local (default) or STORAGE=google
// Mathha code ellaam indha file-ah dhaan use pannum, so storage maarinaalum vera edhuvum maaraadhu.

import { env } from '../config/env.js';
import * as local from './localStore.js';
import * as google from './googleStore.js';

const driver = env.storage === 'google' ? google : local;

export const storageName = env.storage;

// Collections (users, agreements ...) — full list read / write
export const readAll = (name) => driver.readAll(name);
export const writeAll = (name, items) => driver.writeAll(name, items);

// Files (encrypted Aadhaar, generated PDFs) — key e.g. "uploads/abc.enc"
export const saveFile = (key, buffer) => driver.saveFile(key, buffer);
export const readFile = (key) => driver.readFile(key);
export const deleteFile = (key) => driver.deleteFile(key);
