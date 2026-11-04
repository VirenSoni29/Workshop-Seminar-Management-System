import {Router} from 'express';
import {
   getUsers,
   updateUserRole,
   updateUserStatus,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { roleRules, statusRules } from '../validators/userValidator.js';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/', getUsers);
router.patch('/:id/role', roleRules, validate, updateUserRole);
router.patch('/:id/status', statusRules, validate, updateUserStatus);

export default router;