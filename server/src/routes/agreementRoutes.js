import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { uploadSingleFile } from '../middleware/uploadFile.js';
import { listMine, create, getOne, update, remove } from '../controllers/agreementController.js';
import * as uploads from '../controllers/uploadController.js';
import { download } from '../controllers/downloadController.js';
import rateLimit from 'express-rate-limit';

// PDF/Word create panna CPU adhigam — 15 min-ku 60 downloads max
const downloadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, message: { message: 'Too many downloads. Please wait a few minutes.' } });

const router = Router();

// Ellaa agreement routes-um login pannavanga mattum
router.use(requireAuth);

router.get('/', listMine);
router.post('/', create);
router.get('/:id', getOne);
router.put('/:id', update);
router.delete('/:id', remove);

// Documents (Aadhaar) upload
router.get('/:id/uploads', uploads.list);
router.post('/:id/uploads/:docType', uploadSingleFile, uploads.upload);
router.get('/:id/uploads/:docType/file', uploads.view);
router.delete('/:id/uploads/:docType', uploads.remove);

// Word / PDF download
router.get('/:id/download', downloadLimiter, download);

export default router;
