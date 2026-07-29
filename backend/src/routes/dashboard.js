import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getDashboardSummary } from '../controllers/dashboardController.js';

const router = Router();

router.get('/summary', authenticate, getDashboardSummary);

export default router;