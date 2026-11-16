// ⭐ Standard clauses (client / lawyer approve pannadhu) — admin manage pannuvaanga.
// Ellaa agreements-oda "Terms and Conditions"-la automatic-ah varum.

import crypto from 'node:crypto';
import { readCollection, updateCollection } from './jsonStore.js';

const COLLECTION = 'clauses';

export async function listClauses({ activeOnly = false } = {}) {
  const all = await readCollection(COLLECTION);
  return all
    .filter((c) => !activeOnly || c.isActive)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.createdAt.localeCompare(b.createdAt));
}

export async function createClause(data) {
  const now = new Date().toISOString();
  const clause = { id: crypto.randomUUID(), ...data, createdAt: now, updatedAt: now };
  await updateCollection(COLLECTION, (all) => {
    clause.order = all.length;
    all.push(clause);
  });
  return clause;
}

export async function updateClause(id, changes) {
  return updateCollection(COLLECTION, (all) => {
    const c = all.find((x) => x.id === id);
    if (!c) return null;
    Object.assign(c, changes, { updatedAt: new Date().toISOString() });
    return c;
  });
}

export async function deleteClause(id) {
  return updateCollection(COLLECTION, (all) => {
    const i = all.findIndex((x) => x.id === id);
    if (i === -1) return false;
    all.splice(i, 1);
    return true;
  });
}
