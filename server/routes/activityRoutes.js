import {Router} from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {getActivity} from '../controllers/activityController.js';

const router = Router();

router.get('/', protect, authorize('admin'), getActivity);

export default router;