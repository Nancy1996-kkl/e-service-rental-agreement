// 📝 Audit log — yaar, eppo, enna panninaanga (admin Aadhaar paathadhu, client disable pannadhu...).
// Security-ku mukkiyam: sensitive data-ah yaar access pannaanga-nu track pannalaam.

import { readCollection, updateCollection } from './jsonStore.js';

const COLLECTION = 'auditLogs';
const MAX_ENTRIES = 2000; // Pazhaya entries automatic-ah remove

export async function logAction(user, action, target = '', detail = '') {
  try {
    await updateCollection(COLLECTION, (all) => {
      all.push({ at: new Date().toISOString(), userId: user?.id || '', action, target, detail: String(detail).slice(0, 300) });
      if (all.length > MAX_ENTRIES) all.splice(0, all.length - MAX_ENTRIES);
    });
  } catch (err) {
    console.error('Audit log failed:', err.message); // Log fail aanaalum main work nikka koodaadhu
  }
}

export async function listActions(limit = 200) {
  const all = await readCollection(COLLECTION);
  return all.slice(-limit).reverse();
}
