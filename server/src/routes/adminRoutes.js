import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as admin from '../controllers/adminController.js';

const router = Router();

// 🔒 Ellaa routes-um: login + admin role
router.use(requireAuth, requireRole('admin'));

// Word template upload (max 10 MB)
const docxUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } }).single('file');
const withDocx = (req, res, next) =>
  docxUpload(req, res, (err) => (err ? res.status(400).json({ message: 'Upload failed. Max file size is 10 MB.' }) : next()));

router.get('/stats', admin.stats);

router.get('/clients', admin.listClients);
router.get('/clients/:id', admin.getClient);
router.patch('/clients/:id', admin.updateClient);

router.get('/agreements', admin.listAllAgreements);
router.get('/agreements/:id', admin.getAgreementDetails);

router.get('/templates', admin.listAllTemplates);
router.post('/templates', withDocx, admin.uploadTemplate);
router.get('/templates/:id', admin.getTemplateFull);
router.patch('/templates/:id', admin.updateTemplate);
router.post('/templates/:id/file', withDocx, admin.uploadTemplate);
router.delete('/templates/:id', admin.removeTemplate);

router.get('/clauses', admin.listAllClauses);
router.post('/clauses', admin.addClause);
router.post('/clauses/defaults', admin.addDefaultClauses);
router.patch('/clauses/:id', admin.editClause);
router.delete('/clauses/:id', admin.removeClause);

router.get('/audit', admin.auditLog);

export default router;
