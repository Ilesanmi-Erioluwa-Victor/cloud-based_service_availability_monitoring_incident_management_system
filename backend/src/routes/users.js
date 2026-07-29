import { Router } from 'express';
import { getMe, updateNotificationPreferences } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/me', authenticate, getMe);
router.patch('/me/notification-preferences', authenticate, updateNotificationPreferences);

export default router;