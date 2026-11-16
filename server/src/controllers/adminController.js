// 👑 Admin dashboard APIs — admin role-ku mattum (routes/adminRoutes.js-la check).

import { listUsers, findUserById, updateUser, toPublicUser } from '../services/userService.js';
import { readCollection } from '../services/jsonStore.js';
import { findAgreementById } from '../services/agreementService.js';
import { listUploads, toPublicUpload } from '../services/uploadService.js';
import {
  listTemplates,
  getTemplateById,
  importTemplateFromDocx,
  updateTemplateMeta,
  deleteTemplate,
  THEMES,
} from '../services/templateService.js';
import { listClauses, createClause, updateClause, deleteClause } from '../services/clauseService.js';
import { logAction, listActions } from '../services/auditService.js';
import { PLACEHOLDERS } from '../config/placeholders.js';

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const withoutContent = ({ editedContent, ...rest }) => rest;

// ===== Overview =====
// GET /api/admin/stats
export async function stats(req, res) {
  const [users, agreements, uploads, documents] = await Promise.all([
    listUsers(),
    readCollection('agreements'),
    readCollection('uploads'),
    readCollection('documents'),
  ]);
  const byId = new Map(users.map((u) => [u.id, u]));
  const recent = [...agreements]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6)
    .map((a) => ({ ...withoutContent(a), client: byId.get(a.userId)?.fullName || '—' }));

  res.json({
    stats: {
      clients: users.filter((u) => u.role === 'client').length,
      activeClients: users.filter((u) => u.role === 'client' && u.isActive !== false).length,
      agreements: agreements.length,
      drafts: agreements.filter((a) => a.status !== 'completed').length,
      completed: agreements.filter((a) => a.status === 'completed').length,
      uploads: uploads.length,
      downloads: documents.length,
    },
    recent,
  });
}

// ===== Clients =====
// GET /api/admin/clients?search=
export async function listClients(req, res) {
  const q = str(req.query.search, 100).toLowerCase();
  const [users, agreements] = await Promise.all([listUsers(), readCollection('agreements')]);
  const counts = {};
  agreements.forEach((a) => {
    counts[a.userId] = counts[a.userId] || { total: 0, completed: 0, lastActivity: '' };
    counts[a.userId].total += 1;
    if (a.status === 'completed') counts[a.userId].completed += 1;
    if (a.updatedAt > counts[a.userId].lastActivity) counts[a.userId].lastActivity = a.updatedAt;
  });

  const clients = users
    .filter((u) => !q || [u.fullName, u.email, u.mobile].some((f) => f?.toLowerCase().includes(q)))
    .map((u) => ({ ...toPublicUser(u), isActive: u.isActive !== false, agreements: counts[u.id] || { total: 0, completed: 0, lastActivity: '' } }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  res.json({ clients });
}

// GET /api/admin/clients/:id
export async function getClient(req, res) {
  const user = await findUserById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Client not found' });
  const agreements = (await readCollection('agreements'))
    .filter((a) => a.userId === user.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(withoutContent);
  res.json({ client: { ...toPublicUser(user), isActive: user.isActive !== false }, agreements });
}

// PATCH /api/admin/clients/:id  { isActive?, role? }
export async function updateClient(req, res) {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ message: 'You cannot change your own account here' });
  }
  const changes = {};
  if (typeof req.body?.isActive === 'boolean') changes.isActive = req.body.isActive;
  if (req.body?.role !== undefined) {
    if (!['client', 'admin'].includes(req.body.role)) return res.status(400).json({ message: 'Invalid role' });
    changes.role = req.body.role;
  }
  if (!Object.keys(changes).length) return res.status(400).json({ message: 'Nothing to update' });

  const user = await updateUser(req.params.id, changes);
  if (!user) return res.status(404).json({ message: 'Client not found' });
  await logAction(req.user, 'client.update', user.email, JSON.stringify(changes));
  res.json({ client: { ...toPublicUser(user), isActive: user.isActive !== false } });
}

// ===== Agreements =====
// GET /api/admin/agreements?status=&search=
export async function listAllAgreements(req, res) {
  const q = str(req.query.search, 100).toLowerCase();
  const status = ['draft', 'completed'].includes(req.query.status) ? req.query.status : '';
  const [users, agreements] = await Promise.all([listUsers(), readCollection('agreements')]);
  const byId = new Map(users.map((u) => [u.id, u]));

  const list = agreements
    .filter((a) => !status || a.status === status)
    .map((a) => ({ ...withoutContent(a), client: { id: a.userId, fullName: byId.get(a.userId)?.fullName || '—', email: byId.get(a.userId)?.email || '' } }))
    .filter((a) => !q || [a.owner?.fullName, a.tenant?.fullName, a.property?.address, a.client.fullName, a.client.email]
      .some((f) => f?.toLowerCase().includes(q)))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  res.json({ agreements: list });
}

// GET /api/admin/agreements/:id — full details + uploads + generated documents
export async function getAgreementDetails(req, res) {
  const agreement = await findAgreementById(req.params.id);
  if (!agreement) return res.status(404).json({ message: 'Agreement not found' });
  const [client, uploads, documents] = await Promise.all([
    findUserById(agreement.userId),
    listUploads(agreement.id),
    readCollection('documents'),
  ]);
  res.json({
    agreement: withoutContent(agreement),
    client: client ? toPublicUser(client) : null,
    uploads: uploads.map(toPublicUpload),
    documents: documents.filter((d) => d.agreementId === agreement.id),
  });
}

// ===== Templates =====
const usageCounts = async () => {
  const counts = {};
  (await readCollection('agreements')).forEach((a) => (counts[a.templateId] = (counts[a.templateId] || 0) + 1));
  return counts;
};

// GET /api/admin/templates
export async function listAllTemplates(req, res) {
  const [templates, counts] = await Promise.all([listTemplates({ includeInactive: true }), usageCounts()]);
  res.json({
    templates: templates.map(({ html, ...t }) => ({ ...t, usage: counts[t.id] || 0 })),
    themes: THEMES,
    placeholders: PLACEHOLDERS,
  });
}

// GET /api/admin/templates/:id — HTML-oda (inactive-um)
export async function getTemplateFull(req, res) {
  const template = await getTemplateById(req.params.id);
  if (!template) return res.status(404).json({ message: 'Template not found' });
  res.json({ template });
}

function cleanMeta(body = {}) {
  const meta = {};
  if (body.name !== undefined) meta.name = str(body.name, 80);
  if (body.description !== undefined) meta.description = str(body.description, 200);
  if (body.icon !== undefined) meta.icon = str(body.icon, 8) || '📄';
  if (body.theme !== undefined && THEMES.includes(body.theme)) meta.theme = body.theme;
  if (body.order !== undefined && Number.isInteger(Number(body.order))) meta.order = Number(body.order);
  if (body.isActive !== undefined) meta.isActive = body.isActive === true || body.isActive === 'true';
  return meta;
}

const DOCX_SIGNATURE = [0x50, 0x4b, 0x03, 0x04]; // .docx = zip file

// POST /api/admin/templates  (form-data: file=.docx, id, name, description, icon, theme)
// POST /api/admin/templates/:id/file  (Word file replace)
export async function uploadTemplate(req, res) {
  const id = req.params.id || str(req.body?.id, 40).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  if (!id || id.length < 2) return res.status(400).json({ message: 'Enter a template ID (letters, numbers, - or _)' });
  if (!req.file || !DOCX_SIGNATURE.every((b, i) => req.file.buffer[i] === b)) {
    return res.status(400).json({ message: 'Please upload a Word (.docx) file' });
  }
  const exists = await getTemplateById(id);
  if (!req.params.id && exists) return res.status(409).json({ message: 'A template with this ID already exists' });
  if (req.params.id && !exists) return res.status(404).json({ message: 'Template not found' });

  const meta = cleanMeta(req.body);
  if (!req.params.id && !meta.name) return res.status(400).json({ message: 'Enter a template name' });

  const { template, problems } = await importTemplateFromDocx(id, req.file.buffer, meta);
  await logAction(req.user, req.params.id ? 'template.file' : 'template.create', id);
  const { html, ...rest } = template;
  res.status(req.params.id ? 200 : 201).json({ template: rest, problems });
}

// PATCH /api/admin/templates/:id
export async function updateTemplate(req, res) {
  const meta = cleanMeta(req.body);
  if (meta.name === '') return res.status(400).json({ message: 'Name cannot be empty' });
  if (meta.isActive === false) {
    const active = (await listTemplates()).filter((t) => t.id !== req.params.id);
    if (!active.length) return res.status(400).json({ message: 'At least one template must stay active' });
  }
  const template = await updateTemplateMeta(req.params.id, meta);
  if (!template) return res.status(404).json({ message: 'Template not found' });
  await logAction(req.user, 'template.update', req.params.id, JSON.stringify(meta));
  const { html, ...rest } = template;
  res.json({ template: rest });
}

// DELETE /api/admin/templates/:id
export async function removeTemplate(req, res) {
  const used = (await usageCounts())[req.params.id] || 0;
  if (used) {
    return res.status(409).json({ message: `${used} agreement(s) use this template. Turn it off instead of deleting.` });
  }
  if (!(await deleteTemplate(req.params.id))) return res.status(404).json({ message: 'Template not found' });
  await logAction(req.user, 'template.delete', req.params.id);
  res.json({ message: 'Template deleted' });
}

// ===== Standard clauses =====
function cleanClause(body = {}, { partial = false } = {}) {
  const data = {};
  const errors = {};
  if (!partial || body.title !== undefined) data.title = str(body.title, 80);
  if (!partial || body.text !== undefined) {
    data.text = str(body.text, 2000);
    if (data.text.length < 5) errors.text = 'Write the clause text';
  }
  if (!partial || body.templates !== undefined) {
    data.templates = Array.isArray(body.templates) ? body.templates.filter((t) => typeof t === 'string').slice(0, 20) : [];
  }
  if (!partial || body.isActive !== undefined) data.isActive = body.isActive !== false;
  return { data, errors };
}

export async function listAllClauses(req, res) {
  res.json({ clauses: await listClauses() });
}

export async function addClause(req, res) {
  const { data, errors } = cleanClause(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Please fix the errors', errors });
  const clause = await createClause(data);
  await logAction(req.user, 'clause.create', clause.id, data.title);
  res.status(201).json({ clause });
}

export async function editClause(req, res) {
  const { data, errors } = cleanClause(req.body, { partial: true });
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Please fix the errors', errors });
  const clause = await updateClause(req.params.id, data);
  if (!clause) return res.status(404).json({ message: 'Clause not found' });
  await logAction(req.user, 'clause.update', clause.id, clause.title);
  res.json({ clause });
}

export async function removeClause(req, res) {
  if (!(await deleteClause(req.params.id))) return res.status(404).json({ message: 'Clause not found' });
  await logAction(req.user, 'clause.delete', req.params.id);
  res.json({ message: 'Clause deleted' });
}

// ===== Activity log =====
export async function auditLog(req, res) {
  const [actions, users] = await Promise.all([listActions(200), listUsers()]);
  const byId = new Map(users.map((u) => [u.id, u.email]));
  res.json({ actions: actions.map((a) => ({ ...a, user: byId.get(a.userId) || a.userId })) });
}
