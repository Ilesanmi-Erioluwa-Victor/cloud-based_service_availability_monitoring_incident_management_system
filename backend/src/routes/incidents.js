import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  listIncidents,
  acknowledgeIncident,
  resolveIncident,
  updateRootCause,
} from '../controllers/incidentController.js';

const router = Router();

router.get('/', authenticate, listIncidents);
router.patch('/:id/acknowledge', authenticate, acknowledgeIncident);
router.patch('/:id/resolve', authenticate, resolveIncident);
router.patch('/:id/root-cause', authenticate, updateRootCause);

export default router;