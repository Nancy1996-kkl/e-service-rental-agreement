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

// ===== Default clauses (client sonna points) =====
// Clauses list fully empty-ah irundha mattum dhaan add aagum — admin edit / off / delete pannalaam.
// ⚠️ Final wording-ah client / lawyer check pannanum.
const HOME_TEMPLATES = ['house', 'residential', 'custom'];

export const DEFAULT_CLAUSES = [
  {
    seedKey: 'no-changes-without-consent',
    title: 'Prior Consent of Party 1',
    text: 'Party 2 shall not make any structural change, alteration, addition or new fitting in the property, and shall not do anything that affects the property, without the prior written consent of Party 1.',
    templates: [],
  },
  {
    seedKey: 'expenses-by-party-2',
    title: 'Expenses',
    text: 'All expenses arising during the tenancy, including day-to-day repairs and any damage caused by Party 2, their family members, guests or workers, shall be borne by Party 2.',
    templates: [],
  },
  {
    seedKey: 'inform-major-issues',
    title: 'Informing Party 1',
    text: 'Party 2 shall immediately inform Party 1 of any major issue relating to the property, such as water leakage, structural damage, electrical faults, theft, or any dispute or complaint.',
    templates: [],
  },
  {
    seedKey: 'residential-use-only',
    title: 'Residential Use Only',
    text: 'The property is let out only for residence. Party 2 shall not use it for any commercial, business, or other purpose, and shall not sub-let or hand over the property to anyone else.',
    templates: HOME_TEMPLATES,
  },
  {
    seedKey: 'additional-occupants',
    title: 'Additional Occupants',
    text: 'If any person other than Party 2 and their family is to stay in the property, Party 2 shall inform Party 1 in advance.',
    templates: HOME_TEMPLATES,
  },
];

export async function ensureDefaultClauses() {
  if ((await readCollection(COLLECTION)).length) return; // admin already clauses vechirukkaanga
  await updateCollection(COLLECTION, (all) => {
    if (all.length) return; // admin already clauses vechirukkaanga — thoda maattom
    const now = new Date().toISOString();
    DEFAULT_CLAUSES.forEach((c, i) =>
      all.push({ id: crypto.randomUUID(), ...c, isActive: true, order: i, createdAt: now, updatedAt: now })
    );
    console.log(`📜 Default clauses added: ${DEFAULT_CLAUSES.length}`);
  });
}

/** Admin button: default clauses-la illaadhadha mattum add pannum (already irukkuradha thoda maattom) */
export async function addMissingDefaultClauses() {
  return updateCollection(COLLECTION, (all) => {
    const have = new Set(all.map((c) => c.seedKey).filter(Boolean));
    const now = new Date().toISOString();
    const added = DEFAULT_CLAUSES.filter((c) => !have.has(c.seedKey));
    added.forEach((c) =>
      all.push({ id: crypto.randomUUID(), ...c, isActive: true, order: all.length, createdAt: now, updatedAt: now })
    );
    return added.length;
  });
}
