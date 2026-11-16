// GOOGLE storage driver — data → Google Sheet (oru collection = oru tab), files → Google Drive folder.
//
// Sheet-la ovvoru row-um:
//   [ readable columns (client paakka: name, mobile, rent ...) | data_1 | data_2 | ... ]
// data_* columns-la full record JSON irukkum (Google cell limit 50,000 chars — adhanaala chunks).
// ⚠️ data_* columns-ah Sheet-la manual-ah edit pannaadheenga. Readable columns paakka mattum.

import { env } from '../config/env.js';

const CHUNK = 45000;
const CACHE_MS = 30_000; // 30 sec — Sheet-la manual change pannaa 30 sec-la theriyum

// Ovvoru tab-layum mudhal-la varra readable columns (dot path)
export const READABLE_COLUMNS = {
  users: ['id', 'fullName', 'email', 'mobile', 'role', 'isActive', 'createdAt'],
  agreements: ['id', 'status', 'templateId', 'owner.fullName', 'owner.mobile', 'tenant.fullName', 'tenant.mobile',
    'property.address', 'property.monthlyRent', 'property.securityDeposit', 'property.startDate', 'property.endDate',
    'userId', 'createdAt', 'updatedAt'],
  uploads: ['id', 'agreementId', 'docType', 'fileName', 'mimeType', 'size', 'createdAt'],
  templates: ['id', 'name', 'theme', 'isActive', 'updatedAt'],
  documents: ['agreementId', 'format', 'fileName', 'size', 'generatedAt'],
  clauses: ['id', 'title', 'text', 'isActive', 'updatedAt'],
  auditLogs: ['at', 'userId', 'action', 'target', 'detail'],
};

const get = (obj, dotPath) => dotPath.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
const cellValue = (v) => (v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v));

/** Google API clients — tests-la fake clients kudukkalaam */
let clients = null;
export function setClients(c) {
  clients = c;
}
async function api() {
  if (!clients) {
    const { OAuth2Client } = await import('google-auth-library');
    const { sheets } = await import('@googleapis/sheets');
    const { drive } = await import('@googleapis/drive');
    const auth = new OAuth2Client(env.google.clientId, env.google.clientSecret);
    auth.setCredentials({ refresh_token: env.google.refreshToken });
    clients = { sheets: sheets({ version: 'v4', auth }), drive: drive({ version: 'v3', auth }) };
  }
  return clients;
}

// ===================== SHEETS =====================
const cache = new Map(); // name → { items, width, at }
let knownTabs = null;

async function ensureTab(name) {
  const { sheets } = await api();
  if (!knownTabs) {
    const res = await sheets.spreadsheets.get({ spreadsheetId: env.google.sheetId, fields: 'sheets.properties.title' });
    knownTabs = new Set(res.data.sheets.map((s) => s.properties.title));
  }
  if (knownTabs.has(name)) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: env.google.sheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: name } } }] },
  });
  knownTabs.add(name);
}

export function parseRows(rows) {
  if (!rows?.length) return { items: [], width: 0 };
  const header = rows[0];
  const dataCols = header
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => /^data_\d+$/.test(h))
    .sort((a, b) => Number(a.h.slice(5)) - Number(b.h.slice(5)))
    .map(({ i }) => i);

  const items = [];
  for (const row of rows.slice(1)) {
    const json = dataCols.map((i) => row[i] || '').join('');
    if (!json) continue; // Manual-ah add panna / empty rows skip
    try {
      items.push(JSON.parse(json));
    } catch {
      console.warn('⚠️  Skipping a damaged row in Google Sheet');
    }
  }
  return { items, width: header.length };
}

export function buildRows(name, items, minWidth = 0) {
  const readable = READABLE_COLUMNS[name] || ['id'];
  const chunked = items.map((item) => {
    const json = JSON.stringify(item);
    const parts = [];
    for (let i = 0; i < json.length; i += CHUNK) parts.push(json.slice(i, i + CHUNK));
    return { readable: readable.map((c) => cellValue(get(item, c))), parts };
  });
  const maxParts = Math.max(1, ...chunked.map((c) => c.parts.length));
  const header = [...readable, ...Array.from({ length: maxParts }, (_, i) => `data_${i + 1}`)];
  // Pazhaya width-ah vida chinnadha irundha, meedhi cells-ah empty-ah overwrite pannrom
  const width = Math.max(header.length, minWidth);
  const pad = (row) => [...row, ...Array(width - row.length).fill('')];
  return [pad(header), ...chunked.map((c) => pad([...c.readable, ...c.parts]))];
}

async function fetchCollection(name) {
  const { sheets } = await api();
  await ensureTab(name);
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: env.google.sheetId, range: name });
  const parsed = parseRows(res.data.values);
  cache.set(name, { ...parsed, at: Date.now() });
  return parsed;
}

export async function readAll(name) {
  const hit = cache.get(name);
  const data = hit && Date.now() - hit.at < CACHE_MS ? hit : await fetchCollection(name);
  return structuredClone(data.items);
}

export async function writeAll(name, items) {
  const { sheets } = await api();
  await ensureTab(name);
  const prev = cache.get(name) || (await fetchCollection(name));
  const rows = buildRows(name, items, prev.width);

  // 1. Pudhu data mela ezhudhrom  2. Pazhaya extra rows-ah clear pannrom (data lose aagaama indha order)
  await sheets.spreadsheets.values.update({
    spreadsheetId: env.google.sheetId,
    range: `${name}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  });
  await sheets.spreadsheets.values.clear({ spreadsheetId: env.google.sheetId, range: `${name}!A${rows.length + 1}:ZZZ` });

  cache.set(name, { items: structuredClone(items), width: rows[0].length, at: Date.now() });
}

// ===================== DRIVE (files) =====================
const fileIds = new Map(); // key → Drive file id
const driveName = (key) => key.replace(/[\\/]/g, '__');

async function findFileId(key) {
  if (fileIds.has(key)) return fileIds.get(key);
  const { drive } = await api();
  const res = await drive.files.list({
    q: `name = '${driveName(key)}' and '${env.google.driveFolderId}' in parents and trashed = false`,
    fields: 'files(id)',
    pageSize: 1,
  });
  const id = res.data.files?.[0]?.id || null;
  if (id) fileIds.set(key, id);
  return id;
}

export async function saveFile(key, buffer) {
  const { drive } = await api();
  const { Readable } = await import('node:stream');
  const media = { mimeType: 'application/octet-stream', body: Readable.from(buffer) };
  const existing = await findFileId(key);
  if (existing) {
    await drive.files.update({ fileId: existing, media });
  } else {
    const res = await drive.files.create({
      requestBody: { name: driveName(key), parents: [env.google.driveFolderId] },
      media,
      fields: 'id',
    });
    fileIds.set(key, res.data.id);
  }
}

export async function readFile(key) {
  const { drive } = await api();
  const id = await findFileId(key);
  if (!id) throw Object.assign(new Error('File not found'), { code: 'ENOENT' });
  const res = await drive.files.get({ fileId: id, alt: 'media' }, { responseType: 'arraybuffer' });
  return Buffer.from(res.data);
}

export async function deleteFile(key) {
  const { drive } = await api();
  const id = await findFileId(key);
  if (!id) return;
  await drive.files.delete({ fileId: id });
  fileIds.delete(key);
}
