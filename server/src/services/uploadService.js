// ⭐ Uploaded documents storage layer.
// File details (name, size...) → data/uploads.json  |  Encrypted file → storage/uploads/*.enc
// Phase 14-la: details → Google Sheet, encrypted file → Google Drive.

import crypto from 'node:crypto';
import { readCollection, updateCollection } from './jsonStore.js';
import { encrypt, decrypt, saveEncryptedFile, readEncryptedFile, deleteEncryptedFile } from './cryptoService.js';

const COLLECTION = 'uploads';

// Frontend-ku anuppa safe fields mattum (iv, authTag, storageKey anuppa maatom)
export function toPublicUpload(u) {
  return {
    id: u.id,
    docType: u.docType,
    fileName: u.fileName,
    mimeType: u.mimeType,
    size: u.size,
    createdAt: u.createdAt,
  };
}

export async function listUploads(agreementId) {
  const all = await readCollection(COLLECTION);
  return all.filter((u) => u.agreementId === agreementId);
}

export async function findUpload(agreementId, docType) {
  const all = await readCollection(COLLECTION);
  return all.find((u) => u.agreementId === agreementId && u.docType === docType) || null;
}

/** Pudhu file save — same docType-la pazhaya file irundha adha delete panni replace pannum */
export async function saveUpload({ agreementId, userId, docType, fileName, mimeType, buffer }) {
  const { encrypted, iv, authTag } = encrypt(buffer);
  const storageKey = crypto.randomUUID();
  await saveEncryptedFile(storageKey, encrypted);

  const upload = {
    id: crypto.randomUUID(),
    agreementId,
    userId,
    docType,
    fileName,
    mimeType,
    size: buffer.length,
    storageKey,
    iv,
    authTag,
    createdAt: new Date().toISOString(),
  };

  const replaced = await updateCollection(COLLECTION, (all) => {
    const index = all.findIndex((u) => u.agreementId === agreementId && u.docType === docType);
    const old = index === -1 ? null : all.splice(index, 1)[0];
    all.push(upload);
    return old;
  });
  if (replaced) await deleteEncryptedFile(replaced.storageKey);

  return upload;
}

/** Decrypt panni original file buffer */
export async function readUploadFile(upload) {
  const encrypted = await readEncryptedFile(upload.storageKey);
  return decrypt(encrypted, upload.iv, upload.authTag);
}

export async function deleteUpload(agreementId, docType) {
  const removed = await updateCollection(COLLECTION, (all) => {
    const index = all.findIndex((u) => u.agreementId === agreementId && u.docType === docType);
    return index === -1 ? null : all.splice(index, 1)[0];
  });
  if (removed) await deleteEncryptedFile(removed.storageKey);
  return !!removed;
}

/** Agreement delete aagumbodhu adhoda ellaa files-um delete */
export async function deleteAllUploads(agreementId) {
  const removed = await updateCollection(COLLECTION, (all) => {
    const mine = all.filter((u) => u.agreementId === agreementId);
    const rest = all.filter((u) => u.agreementId !== agreementId);
    all.length = 0;
    all.push(...rest);
    return mine;
  });
  await Promise.all(removed.map((u) => deleteEncryptedFile(u.storageKey)));
}
