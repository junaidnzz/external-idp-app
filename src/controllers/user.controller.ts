import { Request, Response, NextFunction } from 'express';
import { CognitoService } from '../services/cognito.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

export class UserController {
  private cognitoService: CognitoService;

  constructor() {
    this.cognitoService = new CognitoService();
  }

  getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.cognitoService.getUser(req.accessToken!);
      
      res.status(200).json({
        message: 'Profile retrieved successfully',
        data: user,
      });
    } catch (error: any) {
      logger.error('GetProfile error:', error);
      next(error);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.cognitoService.updateProfile(req.accessToken!, req.body);
      
      res.status(200).json({
        message: 'Profile updated successfully',
      });
    } catch (error: any) {
      logger.error('UpdateProfile error:', error);
      next(error);
    }
  };

  deleteAccount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.cognitoService.deleteUser(req.accessToken!);
      
      res.status(200).json({
        message: 'Account deleted successfully',
      });
    } catch (error: any) {
      logger.error('DeleteAccount error:', error);
      next(error);
    }
  };

  listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const nextToken = req.query.nextToken as string | undefined;
      
      const result = await this.cognitoService.listUsers(limit, nextToken);
      
      res.status(200).json({
        message: 'Users retrieved successfully',
        data: result,
      });
    } catch (error: any) {
      logger.error('ListUsers error:', error);
      next(error);
    }
  };

  adminCreateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, email, temporaryPassword, sendEmail = true } = req.body;
      
      const user = await this.cognitoService.adminCreateUser(
        username,
        email,
        temporaryPassword,
        sendEmail
      );
      
      res.status(201).json({
        message: 'User created successfully by admin',
        data: user,
      });
    } catch (error: any) {
      logger.error('AdminCreateUser error:', error);
      
      if (error.name === 'UsernameExistsException') {
        res.status(409).json({ error: 'Username already exists' });
        return;
      }
      
      next(error);
    }
  };

  adminDeleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.cognitoService.adminDeleteUser(req.params.username);
      
      res.status(200).json({
        message: 'User deleted successfully by admin',
      });
    } catch (error: any) {
      logger.error('AdminDeleteUser error:', error);
      
      if (error.name === 'UserNotFoundException') {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      next(error);
    }
  };
}