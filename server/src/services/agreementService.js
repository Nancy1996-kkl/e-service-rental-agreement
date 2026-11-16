// ⭐ Agreement storage layer (ippo JSON file — Phase 14-la Google Sheet).

import crypto from 'node:crypto';
import { readCollection, updateCollection } from './jsonStore.js';
import { emptyParty, emptyProperty } from '../utils/agreementValidators.js';
import { defaultTerms } from '../../../shared/terms.js';

const COLLECTION = 'agreements';

// Pazhaya agreements-la terms illana default podrom
const normalize = (a) => (a.terms ? a : { ...a, terms: defaultTerms(a.templateId), editedContent: a.editedContent ?? null });

export async function listAgreementsByUser(userId) {
  const all = (await readCollection(COLLECTION)).map(normalize);
  return all
    .filter((a) => a.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); // Pudhusa update aanadhu mela
}

export async function findAgreementById(id) {
  const all = await readCollection(COLLECTION);
  const found = all.find((a) => a.id === id);
  return found ? normalize(found) : null;
}

export async function createAgreement({ userId, templateId }) {
  const now = new Date().toISOString();
  const agreement = {
    id: crypto.randomUUID(),
    userId,
    templateId,
    status: 'draft', // draft | completed
    currentStep: 'details',
    owner: emptyParty(),
    tenant: emptyParty(),
    property: emptyProperty(),
    terms: defaultTerms(templateId), // Step 4
    editedContent: null, // Step 5 — editor-la maathina document (illana template apdiye)
    createdAt: now,
    updatedAt: now,
  };
  await updateCollection(COLLECTION, (all) => {
    all.push(agreement);
  });
  return agreement;
}

export async function updateAgreement(id, changes) {
  return updateCollection(COLLECTION, (all) => {
    const index = all.findIndex((a) => a.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...changes, updatedAt: new Date().toISOString() };
    return all[index];
  });
}

export async function deleteAgreement(id) {
  return updateCollection(COLLECTION, (all) => {
    const index = all.findIndex((a) => a.id === id);
    if (index === -1) return false;
    all.splice(index, 1);
    return true;
  });
}
