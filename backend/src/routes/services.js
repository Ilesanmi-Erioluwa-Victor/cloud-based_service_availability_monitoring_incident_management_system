import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  listServices,
  createService,
  updateService,
  deleteService,
  getServiceChecks,
  getServiceSLA,
  createMaintenanceWindow,
} from '../controllers/serviceController.js';

const router = Router();

router.get('/', authenticate, listServices);
router.post('/', authenticate, createService);
router.patch('/:id', authenticate, updateService);
router.delete('/:id', authenticate, deleteService);
router.get('/:id/checks', authenticate, getServiceChecks);
router.get('/:id/sla', authenticate, getServiceSLA);
router.post('/:id/maintenance-windows', authenticate, createMaintenanceWindow);

export default router;