import { WIZARD_STEPS } from '../config/templates.js';
import { DOC_TYPES } from '../config/uploads.js';
import { isActiveTemplate } from '../services/templateService.js';
import {
  sanitizeParty,
  sanitizeProperty,
  sanitizeTerms,
  validateDetails,
  validateTerms,
} from '../utils/agreementValidators.js';
import { sanitizeDocumentHtml, MAX_CONTENT_LENGTH } from '../utils/htmlSanitizer.js';
import { getMissingFields } from '../services/documentService.js';
import {
  listAgreementsByUser,
  findAgreementById,
  createAgreement,
  updateAgreement,
  deleteAgreement,
} from '../services/agreementService.js';
import { listUploads, deleteAllUploads } from '../services/uploadService.js';

const stepIndex = (key) => WIZARD_STEPS.indexOf(key);

// 🔒 Security: andha agreement indha user-oda-dhaana nu check pannrom (admin-ku ellaam allowed).
// Vera user-oda agreement-na "not found" nu solrom — adhu irukku-nu kooda theriya koodaadhu.
export async function loadOwnAgreement(req, res) {
  const agreement = await findAgreementById(req.params.id);
  if (!agreement || (agreement.userId !== req.user.id && req.user.role !== 'admin')) {
    res.status(404).json({ message: 'Agreement not found' });
    return null;
  }
  return agreement;
}

// GET /api/agreements — en agreements list
export async function listMine(req, res) {
  const agreements = await listAgreementsByUser(req.user.id);
  // List-ku editedContent theva illa (periya HTML) — chinna response
  res.json({ agreements: agreements.map(({ editedContent, ...rest }) => rest) });
}

// POST /api/agreements — pudhu draft { templateId }
export async function create(req, res) {
  const { templateId } = req.body || {};
  if (typeof templateId !== 'string' || !(await isActiveTemplate(templateId))) {
    return res.status(400).json({ message: 'Please select a valid template' });
  }
  const agreement = await createAgreement({ userId: req.user.id, templateId });
  res.status(201).json({ agreement });
}

// GET /api/agreements/:id
export async function getOne(req, res) {
  const agreement = await loadOwnAgreement(req, res);
  if (agreement) res.json({ agreement });
}

/**
 * Oru step-ku poga, adhukku munnaadi irukka ellaa steps-um complete-ah irukkanum.
 * Problem irundha { message, errors } return pannum, illana null.
 */
export async function checkCanReach(targetStep, agreement) {
  const target = stepIndex(targetStep);

  if (target > stepIndex('details')) {
    const errors = validateDetails(agreement);
    if (Object.keys(errors).length) return { message: 'Please complete all required details', errors };
  }
  if (target > stepIndex('upload')) {
    const uploaded = new Set((await listUploads(agreement.id)).map((u) => u.docType));
    const missing = Object.entries(DOC_TYPES).filter(([t]) => !uploaded.has(t)).map(([, label]) => label);
    if (missing.length) return { message: `Please upload: ${missing.join(', ')}` };
  }
  if (target > stepIndex('rules')) {
    const errors = validateTerms(agreement.terms);
    if (Object.keys(errors).length) return { message: 'Please complete the terms', errors };
  }
  if (target > stepIndex('preview')) {
    const missing = await getMissingFields(agreement);
    if (missing.length) return { message: `Some details are missing: ${missing.join(', ')}` };
  }
  return null;
}

// PUT /api/agreements/:id — draft save (auto-save) & step maathradhu
export async function update(req, res) {
  const agreement = await loadOwnAgreement(req, res);
  if (!agreement) return;
  const body = req.body || {};

  // Completed agreement: "Make changes" (reopen) mattum allowed
  if (agreement.status === 'completed') {
    if (body.status === 'draft') {
      const reopened = await updateAgreement(agreement.id, { status: 'draft', currentStep: 'editor' });
      return res.json({ agreement: reopened });
    }
    return res.status(400).json({ message: 'This agreement is completed. Click "Make changes" to edit it again.' });
  }

  const changes = {};

  // Allowed fields mattum edukkrom — userId, status maadhiri fields-ah user maatha mudiyaadhu
  if (body.templateId !== undefined && body.templateId !== agreement.templateId) {
    if (typeof body.templateId !== 'string' || !(await isActiveTemplate(body.templateId))) {
      return res.status(400).json({ message: 'Invalid template' });
    }
    changes.templateId = body.templateId;
    changes.editedContent = null; // Template maarinaa, pazhaya template-la panna edits pogum
  }
  if (body.owner) changes.owner = sanitizeParty(body.owner);
  if (body.tenant) changes.tenant = sanitizeParty(body.tenant);
  if (body.property) changes.property = sanitizeProperty(body.property);
  if (body.terms) changes.terms = sanitizeTerms(body.terms);

  if (body.editedContent !== undefined) {
    if (body.editedContent === null) {
      changes.editedContent = null; // "Reset to template"
    } else {
      if (typeof body.editedContent !== 'string' || body.editedContent.length > MAX_CONTENT_LENGTH) {
        return res.status(400).json({ message: 'Document is too large' });
      }
      changes.editedContent = sanitizeDocumentHtml(body.editedContent);
    }
  }

  if (body.currentStep !== undefined) {
    if (stepIndex(body.currentStep) === -1) return res.status(400).json({ message: 'Invalid step' });
    const problem = await checkCanReach(body.currentStep, { ...agreement, ...changes });
    if (problem) return res.status(400).json(problem);
    // Pinnaadi step-ku ponaa (e.g. Back) currentStep kuraiyaadhu — reach panna max step-ah vechukkrom
    if (stepIndex(body.currentStep) > stepIndex(agreement.currentStep)) changes.currentStep = body.currentStep;
  }

  const updated = await updateAgreement(agreement.id, changes);
  res.json({ agreement: updated });
}

// DELETE /api/agreements/:id — draft mattum delete panna mudiyum
export async function remove(req, res) {
  const agreement = await loadOwnAgreement(req, res);
  if (!agreement) return;
  if (agreement.status !== 'draft') {
    return res.status(400).json({ message: 'Only draft agreements can be deleted' });
  }
  await deleteAllUploads(agreement.id); // Aadhaar files-um serndhu delete
  await deleteAgreement(agreement.id);
  res.json({ message: 'Draft deleted' });
}
