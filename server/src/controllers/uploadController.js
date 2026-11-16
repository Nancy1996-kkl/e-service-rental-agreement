import { DOC_TYPES, detectFileType } from '../config/uploads.js';
import { loadOwnAgreement } from './agreementController.js';
import { updateAgreement } from '../services/agreementService.js';
import { logAction } from '../services/auditService.js';
import {
  listUploads,
  findUpload,
  saveUpload,
  readUploadFile,
  deleteUpload,
  toPublicUpload,
} from '../services/uploadService.js';

// File name-ah safe-ah maathrom (folder path, special characters remove)
function cleanFileName(original, ext) {
  // Browser UTF-8-la anuppum, multer latin1-ah read pannum — adha correct pannrom
  const decoded = Buffer.from(original || 'document', 'latin1').toString('utf8');
  const base = decoded
    .split(/[\\/]/).pop()
    .replace(/\.[^.]*$/, '') // pazhaya extension remove
    .replace(/[^\w\s.-]/g, '')
    .trim()
    .slice(0, 80) || 'document';
  return `${base}.${ext}`; // Real file type-oda extension
}

function checkDocType(req, res) {
  if (!DOC_TYPES[req.params.docType]) {
    res.status(400).json({ message: 'Unknown document type' });
    return false;
  }
  return true;
}

// GET /api/agreements/:id/uploads
export async function list(req, res) {
  const agreement = await loadOwnAgreement(req, res);
  if (!agreement) return;
  const uploads = await listUploads(agreement.id);
  res.json({ uploads: uploads.map(toPublicUpload), consentAt: agreement.uploadConsentAt || null });
}

// POST /api/agreements/:id/uploads/:docType   (form-data: file, consent)
export async function upload(req, res) {
  if (!checkDocType(req, res)) return;
  const agreement = await loadOwnAgreement(req, res);
  if (!agreement) return;

  if (agreement.status === 'completed') {
    return res.status(400).json({ message: 'Completed agreements cannot be changed' });
  }

  // User consent illama Aadhaar vaanga koodaadhu
  if (!agreement.uploadConsentAt && req.body?.consent !== 'true') {
    return res.status(400).json({ message: 'Please accept the consent to upload documents' });
  }

  if (!req.file) return res.status(400).json({ message: 'Please choose a file to upload' });

  // Real file type check (extension illa, file content vechu)
  const type = detectFileType(req.file.buffer);
  if (!type) {
    return res.status(400).json({ message: 'Only PDF, JPG and PNG files are allowed' });
  }

  const saved = await saveUpload({
    agreementId: agreement.id,
    userId: req.user.id,
    docType: req.params.docType,
    fileName: cleanFileName(req.file.originalname, type.ext),
    mimeType: type.mime,
    buffer: req.file.buffer,
  });

  if (!agreement.uploadConsentAt) {
    await updateAgreement(agreement.id, { uploadConsentAt: new Date().toISOString() });
  }

  res.status(201).json({ upload: toPublicUpload(saved) });
}

// GET /api/agreements/:id/uploads/:docType/file — decrypt panni kaattum (owner / admin mattum)
export async function view(req, res) {
  if (!checkDocType(req, res)) return;
  const agreement = await loadOwnAgreement(req, res);
  if (!agreement) return;

  const record = await findUpload(agreement.id, req.params.docType);
  if (!record) return res.status(404).json({ message: 'Document not found' });

  const buffer = await readUploadFile(record);
  // Admin vera client-oda Aadhaar paathaa log pannrom
  if (agreement.userId !== req.user.id) await logAction(req.user, 'upload.view', agreement.id, record.docType);
  res.set({
    'Content-Type': record.mimeType,
    'Content-Length': buffer.length,
    'Content-Disposition': `inline; filename="${record.fileName}"`,
    'Cache-Control': 'private, no-store', // Browser cache-la save aagaadhu
    'X-Content-Type-Options': 'nosniff',
  });
  res.send(buffer);
}

// DELETE /api/agreements/:id/uploads/:docType
export async function remove(req, res) {
  if (!checkDocType(req, res)) return;
  const agreement = await loadOwnAgreement(req, res);
  if (!agreement) return;
  if (agreement.status === 'completed') {
    return res.status(400).json({ message: 'Completed agreements cannot be changed' });
  }
  const deleted = await deleteUpload(agreement.id, req.params.docType);
  if (!deleted) return res.status(404).json({ message: 'Document not found' });
  res.json({ message: 'Document removed' });
}
