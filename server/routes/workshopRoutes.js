import express from 'express';
import {
   createWorkshop,
   getWorkshops,
   getMyWorkshops,
   getWorkshop,
   updateWorkshop,
   deleteWorkshop,
   submitWorkshop,
   approveWorkshop,
   rejectWorkshop,
   completeWorkshop,
   cancelWorkshop,
} from '../controllers/workshopController.js';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
   createWorkshopRules,
   updateWorkshopRules,
   rejectRules
} from '../validators/workshopValidator.js';

const router = express.Router();

// Every workshop route needs a logged-in user
router.use(protect);

router.get('/', getWorkshops);
router.post('/', authorize('faculty', 'admin'), createWorkshopRules, validate, createWorkshop);

// '/my' must be declared BEFORE '/:id', or Express treats "my" as an id
router.get('/my', authorize('faculty', 'admin'), getMyWorkshops);

router.get('/:id', getWorkshop);
router.put('/:id', authorize('faculty', 'admin'), updateWorkshopRules, validate, updateWorkshop);
router.delete('/:id', authorize('faculty', 'admin'), deleteWorkshop);

router.patch('/:id/submit', authorize('faculty', 'admin'), submitWorkshop);
router.patch('/:id/approve', authorize('admin'), approveWorkshop);
router.patch('/:id/reject', authorize('admin'), rejectRules, validate, rejectWorkshop);
router.patch('/:id/complete', authorize('faculty', 'admin'), completeWorkshop);
router.patch('/:id/cancel', authorize('faculty', 'admin'), cancelWorkshop);

export default router;