import { Router } from 'express';
import {
   registerForWorkshop,
   cancelRegistration,
   getMyRegistrations,
   getWorkshopRegistrations,
} from '../controllers/registrationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/my', getMyRegistrations);

router.post(
   '/workshops/:workshopId/register',
   authorize('student', 'faculty'),
   registerForWorkshop
);
router.get(
   '/workshops/:workshopId',
   authorize('faculty', 'admin'),
   getWorkshopRegistrations
);

router.delete('/:id', cancelRegistration);

export default router;