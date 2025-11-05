import { Request, Response, NextFunction } from 'express';
import { CognitoService } from '../services/cognito.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

export class AuthController {
  private cognitoService: CognitoService;

  constructor() {
    this.cognitoService = new CognitoService();
  }

  signUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.cognitoService.signUp(req.body);
      
      res.status(201).json({
        message: 'User created successfully',
        data: result,
      });
    } catch (error: any) {
      logger.error('SignUp error:', error);
      
      if (error.name === 'UsernameExistsException') {
        res.status(409).json({ error: 'Username already exists' });
        return;
      }
      
      if (error.name === 'InvalidPasswordException') {
        res.status(400).json({ error: 'Invalid password format' });
        return;
      }
      
      next(error);
    }
  };

  signIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.cognitoService.signIn(req.body);
      
      res.status(200).json({
        message: 'Sign in successful',
        data: result,
      });
    } catch (error: any) {
      logger.error('SignIn error:', error);
      
      if (error.name === 'NotAuthorizedException') {
        res.status(401).json({ error: 'Invalid username or password' });
        return;
      }
      
      if (error.name === 'UserNotConfirmedException') {
        res.status(403).json({ error: 'User email not verified' });
        return;
      }
      
      next(error);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.cognitoService.verifyEmail(req.body);
      
      res.status(200).json({
        message: 'Email verified successfully',
      });
    } catch (error: any) {
      logger.error('VerifyEmail error:', error);
      
      if (error.name === 'CodeMismatchException') {
        res.status(400).json({ error: 'Invalid verification code' });
        return;
      }
      
      if (error.name === 'ExpiredCodeException') {
        res.status(400).json({ error: 'Verification code has expired' });
        return;
      }
      
      next(error);
    }
  };

  resendVerificationCode = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.cognitoService.resendVerificationCode(req.params.username);
      
      res.status(200).json({
        message: 'Verification code sent successfully',
      });
    } catch (error: any) {
      logger.error('ResendVerificationCode error:', error);
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.cognitoService.forgotPassword(req.body);
      
      res.status(200).json({
        message: 'Password reset code sent successfully',
      });
    } catch (error: any) {
      logger.error('ForgotPassword error:', error);
      
      if (error.name === 'UserNotFoundException') {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.cognitoService.resetPassword(req.body);
      
      res.status(200).json({
        message: 'Password reset successfully',
      });
    } catch (error: any) {
      logger.error('ResetPassword error:', error);
      
      if (error.name === 'CodeMismatchException') {
        res.status(400).json({ error: 'Invalid reset code' });
        return;
      }
      
      if (error.name === 'ExpiredCodeException') {
        res.status(400).json({ error: 'Reset code has expired' });
        return;
      }
      
      next(error);
    }
  };

  changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.cognitoService.changePassword({
        accessToken: req.accessToken!,
        ...req.body,
      });
      
      res.status(200).json({
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      logger.error('ChangePassword error:', error);
      
      if (error.name === 'NotAuthorizedException') {
        res.status(401).json({ error: 'Invalid current password' });
        return;
      }
      
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.cognitoService.refreshToken(req.body);
      
      res.status(200).json({
        message: 'Token refreshed successfully',
        data: result,
      });
    } catch (error: any) {
      logger.error('RefreshToken error:', error);
      
      if (error.name === 'NotAuthorizedException') {
        res.status(401).json({ error: 'Invalid refresh token' });
        return;
      }
      
      next(error);
    }
  };

  signOut = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.cognitoService.signOut(req.accessToken!);
      
      res.status(200).json({
        message: 'Sign out successful',
      });
    } catch (error: any) {
      logger.error('SignOut error:', error);
      next(error);
    }
  };
}