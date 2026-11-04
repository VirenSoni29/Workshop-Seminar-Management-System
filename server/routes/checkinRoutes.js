import { Router } from 'express';
import { scanCheckIn, manualCheckIn } from '../controllers/checkinController.js';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { scanRules } from '../validators/checkinValidator.js';

const router = Router();

router.use(protect, authorize('faculty', 'admin'));

router.post('/scan', scanRules, validate, scanCheckIn);
router.patch('/manual/:registrationId', manualCheckIn);

export default router;