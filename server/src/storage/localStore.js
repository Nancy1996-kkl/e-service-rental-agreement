// LOCAL storage driver — data/*.json files (development / chinna setup-ku).

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';

const fileFor = (name) => path.join(env.dataDir, `${name}.json`);

export async function readAll(name) {
  try {
    return JSON.parse(await fs.readFile(fileFor(name), 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return []; // File innum create aagala
    throw err;
  }
}

export async function writeAll(name, items) {
  await fs.mkdir(env.dataDir, { recursive: true });
  const file = fileFor(name);
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(items, null, 2));
  await fs.rename(tmp, file); // Paadhi-la crash aanaalum file corrupt aagaadhu
}

// ===== Files (encrypted uploads, generated PDFs) =====
const pathFor = (key) => {
  const full = path.resolve(env.filesDir, key);
  if (!full.startsWith(env.filesDir + path.sep)) throw new Error('Invalid file key'); // ../ hack thadukka
  return full;
};

export async function saveFile(key, buffer) {
  const full = pathFor(key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buffer);
}

export async function readFile(key) {
  return fs.readFile(pathFor(key));
}

export async function deleteFile(key) {
  await fs.rm(pathFor(key), { force: true });
}
