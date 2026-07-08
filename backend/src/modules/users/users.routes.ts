import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { getUsers, createUser, deleteUser, updateUserRole, resetUserPassword } from './users.controller';

const router = Router();

router.use(authenticate, requireRole('super_admin'));

router.get('/', getUsers);
router.post('/', createUser);
router.delete('/:id', deleteUser);
router.put('/:id/role', updateUserRole);
router.put('/:id/password', resetUserPassword);

export default router;
