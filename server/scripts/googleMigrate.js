// STEP 3 (optional) — local data (server/data/*.json + server/storage files) → Google Sheet & Drive copy.
//
// Run (main folder-la):  npm run google:migrate
// .env-la Google values ellaam set pannirukkanum. Local files delete aagaadhu (backup-ah irukkum).

import 'dotenv/config';
import { promises as fs } from 'node:fs';
import path from 'node:path';

process.env.STORAGE = 'google'; // env.js Google values-ah check pannum
const { env } = await import('../src/config/env.js');
const google = await import('../src/storage/googleStore.js');

const COLLECTIONS = Object.keys(google.READABLE_COLUMNS);

for (const name of COLLECTIONS) {
  let items = [];
  try {
    items = JSON.parse(await fs.readFile(path.join(env.dataDir, `${name}.json`), 'utf8'));
  } catch {
    continue; // Local-la indha collection illa
  }
  await google.writeAll(name, items);
  console.log(`✅ ${name}: ${items.length} record(s)`);
}

async function* walk(dir) {
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else yield full;
  }
}

let count = 0;
for await (const file of walk(env.filesDir)) {
  const key = path.relative(env.filesDir, file).split(path.sep).join('/');
  await google.saveFile(key, await fs.readFile(file));
  count += 1;
}
console.log(`✅ files: ${count} uploaded to Drive`);
console.log('\nDone. Set STORAGE=google in server/.env and restart the server.');
