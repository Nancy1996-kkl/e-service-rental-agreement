import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { list, getOne, placeholders } from '../controllers/templateController.js';

const router = Router();

// Template names list — Home page-la kooda kaattalaam, so login theva illa
router.get('/', list);

// Full template content — login pannavanga mattum
router.get('/placeholders', requireAuth, placeholders);
router.get('/:id', requireAuth, getOne);

export default router;
