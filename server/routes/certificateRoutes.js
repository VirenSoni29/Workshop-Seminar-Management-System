import { Router } from 'express';
import {
   generateCertificates,
   getMyCertificates,
   downloadCertificate,
   verifyCertificate,
} from '../controllers/certificateController.js';
import { protect, authorize } from '../middleware/auth.js';
import { verifyLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// PUBLIC: must be declared BEFORE router.use(protect)
router.get('/verify/:certificateId', verifyLimiter, verifyCertificate);

// Everything below needs login
router.use(protect);

router.get('/my', getMyCertificates);
router.post('/workshops/:workshopId/generate', authorize('faculty', 'admin'), generateCertificates);
router.get('/:id/download', downloadCertificate);

export default router;