import { Router } from 'express';
import { getPublicStatus } from '../controllers/publicController.js';

const router = Router();

router.get('/status', getPublicStatus);

export default router;