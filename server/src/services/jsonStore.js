// Collection helper — read & safe update (local JSON files or Google Sheet, storage/index.js decide pannum).

import { readAll, writeAll } from '../storage/index.js';

// Oru nerathula oru write mattum nadakkanum (auto-save fast-ah varumbodhu data corrupt aagaama irukka).
let queue = Promise.resolve();

export async function readCollection(name) {
  return readAll(name);
}

/**
 * Read → change → write, safe-ah (queue vazhiya).
 * updater(items) return pannra value-ah caller-ku thirumba kudukkum.
 */
export function updateCollection(name, updater) {
  const run = queue.then(async () => {
    const items = await readAll(name);
    const result = await updater(items);
    await writeAll(name, items);
    return result;
  });
  queue = run.catch(() => {}); // Oru write fail aanaalum adutha writes nikkaadhu
  return run;
}
