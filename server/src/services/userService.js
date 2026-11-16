// ⭐ User storage layer (ippo JSON file — Phase 14-la Google Sheet).
// Controllers indha functions-ah mattum dhaan call pannum.

import crypto from 'node:crypto';
import { readCollection, updateCollection } from './jsonStore.js';

const COLLECTION = 'users';

export async function findUserByEmail(email) {
  const users = await readCollection(COLLECTION);
  return users.find((u) => u.email === email.toLowerCase()) || null;
}

export async function findUserById(id) {
  const users = await readCollection(COLLECTION);
  return users.find((u) => u.id === id) || null;
}

export async function createUser({ fullName, mobile, email, passwordHash, role = 'client' }) {
  const now = new Date().toISOString();
  const user = {
    id: crypto.randomUUID(),
    fullName,
    mobile,
    email: email.toLowerCase(),
    passwordHash,
    role,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  await updateCollection(COLLECTION, (users) => {
    users.push(user);
  });
  return user;
}

// Password hash-ah frontend-ku anuppave koodaadhu — safe fields mattum
export function toPublicUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function listUsers() {
  return readCollection(COLLECTION);
}

/** Admin: user-ah enable/disable, role maathradhu */
export async function updateUser(id, changes) {
  return updateCollection(COLLECTION, (users) => {
    const user = users.find((u) => u.id === id);
    if (!user) return null;
    Object.assign(user, changes, { updatedAt: new Date().toISOString() });
    return user;
  });
}
