import multer from 'multer';
import { MAX_FILE_SIZE } from '../config/uploads.js';

// File-ah memory-la vaangurom (disk-la plain-ah save aagaadhu) — apram encrypt panni dhaan save.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 5 },
}).single('file');

// Multer errors-ah user-ku puriyura message-ah maathrom
export function uploadSingleFile(req, res, next) {
  upload(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: `File is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB.` });
    }
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'Invalid upload. Please send one file.' });
    }
    next(err);
  });
}
