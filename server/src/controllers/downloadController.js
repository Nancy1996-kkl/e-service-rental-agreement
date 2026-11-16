import { loadOwnAgreement, checkCanReach } from './agreementController.js';
import { generatePdf, generateDocx } from '../services/documentService.js';
import { updateAgreement } from '../services/agreementService.js';
import { updateCollection } from '../services/jsonStore.js';
import { saveFile } from '../storage/index.js';
import { logAction } from '../services/auditService.js';

const FORMATS = {
  pdf: { generate: generatePdf, mime: 'application/pdf' },
  docx: { generate: generateDocx, mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
};

// "Rental-Agreement-Suresh-M-2027-01-01.pdf"
function fileNameFor(agreement, ext) {
  const tenant = (agreement.tenant.fullName || 'Tenant').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  return `Rental-Agreement-${tenant || 'Tenant'}-${agreement.property.startDate || 'draft'}.${ext}`;
}

// GET /api/agreements/:id/download?format=pdf|docx
export async function download(req, res) {
  const format = FORMATS[req.query.format];
  if (!format) return res.status(400).json({ message: 'Format must be pdf or docx' });

  const agreement = await loadOwnAgreement(req, res);
  if (!agreement) return;

  // Incomplete document generate panna koodaadhu — ellaa steps-um check
  const problem = await checkCanReach('download', agreement);
  if (problem) return res.status(400).json(problem);

  const buffer = await format.generate(agreement);
  const fileName = fileNameFor(agreement, req.query.format);

  // Generated copy save (admin dashboard-la paakka) + record
  await saveFile(`documents/${agreement.id}.${req.query.format}`, buffer);
  const now = new Date().toISOString();
  await updateCollection('documents', (all) => {
    const i = all.findIndex((d) => d.agreementId === agreement.id && d.format === req.query.format);
    const record = { agreementId: agreement.id, userId: agreement.userId, format: req.query.format, fileName, size: buffer.length, generatedAt: now };
    if (i === -1) all.push(record);
    else all[i] = record;
  });

  const isOwner = agreement.userId === req.user.id;
  if (!isOwner) await logAction(req.user, 'agreement.download', agreement.id, req.query.format);

  // Owner first download → agreement "Completed" (admin download pannaa status maaraadhu)
  if (isOwner && agreement.status !== 'completed') {
    await updateAgreement(agreement.id, { status: 'completed', completedAt: now, currentStep: 'download' });
  }

  res.set({
    'Content-Type': format.mime,
    'Content-Length': buffer.length,
    'Content-Disposition': `attachment; filename="${fileName}"`,
    'Cache-Control': 'private, no-store',
  });
  res.send(buffer);
}
