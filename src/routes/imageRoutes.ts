import { Router } from 'express';
import { generateImage } from '../controllers/imageController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/generate-image', requireAuth, generateImage);

export default router;
