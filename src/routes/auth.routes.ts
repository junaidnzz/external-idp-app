import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  signUpValidator,
  signInValidator,
  verifyEmailValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  refreshTokenValidator,
  usernameParamValidator,
} from '../validators/user.validators';

const router = Router();
const authController = new AuthController();

router.post('/signup', validate(signUpValidator), authController.signUp);

router.post('/signin', validate(signInValidator), authController.signIn);

router.post('/verify-email', validate(verifyEmailValidator), authController.verifyEmail);

router.post(
  '/resend-verification/:username',
  validate(usernameParamValidator),
  authController.resendVerificationCode
);

router.post('/forgot-password', validate(forgotPasswordValidator), authController.forgotPassword);

router.post('/reset-password', validate(resetPasswordValidator), authController.resetPassword);

router.post(
  '/change-password',
  authMiddleware.authenticate,
  validate(changePasswordValidator),
  authController.changePassword
);

router.post('/refresh-token', validate(refreshTokenValidator), authController.refreshToken);

router.post('/signout', authMiddleware.authenticate, authController.signOut);

export default router;