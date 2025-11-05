import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  updateProfileValidator,
  adminCreateUserValidator,
  usernameParamValidator,
} from '../validators/user.validators';

const router = Router();
const userController = new UserController();

router.get('/profile', authMiddleware.authenticate, userController.getProfile);

router.put(
  '/profile',
  authMiddleware.authenticate,
  validate(updateProfileValidator),
  userController.updateProfile
);

router.delete('/account', authMiddleware.authenticate, userController.deleteAccount);

router.get('/list', authMiddleware.authenticate, userController.listUsers);

router.post(
  '/admin/create',
  authMiddleware.authenticate,
  validate(adminCreateUserValidator),
  userController.adminCreateUser
);

router.delete(
  '/admin/:username',
  authMiddleware.authenticate,
  validate(usernameParamValidator),
  userController.adminDeleteUser
);

export default router;