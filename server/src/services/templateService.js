// ⭐ Template storage layer (ippo data/templates.json — Phase 14-la Google Sheet).
//
// Source: server/templates-docx/<id>.docx files.
// Server first time start aagumbodhu, templates.json illana andha .docx files-ah
// automatic-ah HTML-ah convert panni save pannum.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { readCollection, updateCollection } from './jsonStore.js';
import { convertDocxToHtml } from '../utils/docxImport.js';

const COLLECTION = 'templates';
export const DOCX_DIR = path.resolve('templates-docx');

// Default name / icon — admin dashboard (Phase 15)-la maathalaam
const DEFAULT_META = {
  house: { name: 'House Rental Agreement', description: 'For renting an independent house or villa to a family or individual.', icon: '🏠', order: 1, theme: 'classic' },
  residential: { name: 'Residential Rental Agreement', description: 'For apartments, flats and other residential units.', icon: '🏢', order: 2, theme: 'modern' },
  commercial: { name: 'Commercial Rental Agreement', description: 'For shops, offices, godowns and other business premises.', icon: '🏬', order: 3, theme: 'corporate' },
  custom: { name: 'Custom Rental Agreement', description: 'Start from a flexible format and tailor the terms to your needs.', icon: '📝', order: 4, theme: 'elegant' },
};

function metaFor(id) {
  // Pudhu template (e.g. "lease.docx") → file name-la irundhu name
  const fallbackName = id.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return DEFAULT_META[id] || { name: `${fallbackName} Agreement`, description: 'Rental agreement template.', icon: '📄', order: 99, theme: 'classic' };
}

/** Oru .docx-ah import panni save pannum (pudhusa illana update). Returns { template, problems } */
export async function importTemplateFromDocx(id, buffer, meta = {}) {
  const { html, placeholders, problems } = await convertDocxToHtml(buffer);
  const now = new Date().toISOString();

  const template = await updateCollection(COLLECTION, (all) => {
    const existing = all.find((t) => t.id === id);
    if (existing) {
      Object.assign(existing, meta, { html, placeholders, updatedAt: now });
      return existing;
    }
    const created = { id, ...metaFor(id), ...meta, html, placeholders, isActive: true, createdAt: now, updatedAt: now };
    all.push(created);
    return created;
  });

  return { template, problems };
}

function docxFiles() {
  return fs.readdir(DOCX_DIR).then((files) =>
    files.filter((f) => f.toLowerCase().endsWith('.docx') && !f.startsWith('~$'))
  );
}

const idFromFile = (file) => path.basename(file, '.docx').toLowerCase().replace(/[^a-z0-9_-]/g, '-');

/** templates-docx folder-la irukka ellaa .docx files-um import pannum (already irukkaradhu update aagum) */
export async function importAllFromFolder() {
  const report = [];
  for (const file of await docxFiles()) {
    const id = idFromFile(file);
    const { problems } = await importTemplateFromDocx(id, await fs.readFile(path.join(DOCX_DIR, file)));
    report.push({ id, file, problems });
  }
  return report;
}

/**
 * Server start-la automatic sync:
 *  - Folder-la irukka .docx, list-la ILLANA → add pannum (miss aanaalum thirumba varum)
 *  - .docx file save aanadhu, template last update-ah vida PUDHUSA-na → update pannum
 *    (client pudhu Word file pottaa, server restart-la automatic-ah apply aagum)
 */
export async function ensureTemplatesSeeded() {
  const saved = new Map((await readCollection(COLLECTION)).map((t) => [t.id, t]));

  for (const file of await docxFiles()) {
    const id = idFromFile(file);
    const filePath = path.join(DOCX_DIR, file);
    const existing = saved.get(id);
    const { mtimeMs } = await fs.stat(filePath);

    if (existing?.isDeleted) continue; // Admin delete pannadhu — thirumba add panna maattom
    if (existing && mtimeMs <= Date.parse(existing.updatedAt)) continue; // Already latest

    const { problems } = await importTemplateFromDocx(id, await fs.readFile(filePath));
    console.log(`📄 Template ${existing ? 'updated' : 'added'}: ${file} → "${id}"`);
    problems.forEach((p) => console.warn(`   ⚠️  ${file}: ${p}`));
  }
}

// Design themes: classic | modern | corporate | elegant (client/src/index.css-la styles)
export const THEMES = ['classic', 'modern', 'corporate', 'elegant'];

// Pazhaya saved templates-la theme illana default kudukkrom
const withTheme = (t) => ({ ...t, theme: THEMES.includes(t.theme) ? t.theme : metaFor(t.id).theme });

export async function listTemplates({ includeInactive = false } = {}) {
  const all = (await readCollection(COLLECTION)).map(withTheme);
  return all
    .filter((t) => !t.isDeleted && (includeInactive || t.isActive))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function getTemplateById(id) {
  const all = await readCollection(COLLECTION);
  const found = all.find((t) => t.id === id && !t.isDeleted);
  return found ? withTheme(found) : null;
}

export async function isActiveTemplate(id) {
  const t = await getTemplateById(id);
  return !!t?.isActive;
}

/** Admin: name, description, icon, theme, on/off, order maathradhu */
export async function updateTemplateMeta(id, changes) {
  return updateCollection(COLLECTION, (all) => {
    const t = all.find((x) => x.id === id && !x.isDeleted);
    if (!t) return null;
    Object.assign(t, changes, { updatedAt: new Date().toISOString() });
    return withTheme(t);
  });
}

/**
 * Admin delete — record-ah "isDeleted" nu mark pannrom (folder-la .docx irundhaalum thirumba varaadhu).
 * Agreements use pannura template-ah delete panna mudiyaadhu (controller check pannum).
 */
export async function deleteTemplate(id) {
  return updateCollection(COLLECTION, (all) => {
    const t = all.find((x) => x.id === id && !x.isDeleted);
    if (!t) return false;
    Object.assign(t, { isDeleted: true, isActive: false, html: '', updatedAt: new Date().toISOString() });
    return true;
  });
}
