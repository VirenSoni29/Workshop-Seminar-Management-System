import {Router} from 'express';
import { getStats } from '../controllers/statsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, authorize('admin'), getStats);

export default router;