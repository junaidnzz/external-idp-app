import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ChangePasswordCommand,
  GetUserCommand,
  UpdateUserAttributesCommand,
  DeleteUserCommand,
  AdminDeleteUserCommand,
  ListUsersCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  ResendConfirmationCodeCommand,
  GlobalSignOutCommand,
  AuthFlowType,
  MessageActionType,
} from '@aws-sdk/client-cognito-identity-provider';
import crypto from 'crypto';
import { config } from '../config/env.config';
import { logger } from '../utils/logger';
import {
  User,
  SignUpRequest,
  SignInRequest,
  SignInResponse,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  RefreshTokenRequest,
} from '../types/user.types';

export class CognitoService {
  private client: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;
  private clientSecret?: string;

  constructor() {
    this.client = new CognitoIdentityProviderClient({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });
    this.userPoolId = config.cognito.userPoolId;
    this.clientId = config.cognito.clientId;
    this.clientSecret = config.cognito.clientSecret;
  }

  private calculateSecretHash(username: string): string {
    if (!this.clientSecret) return '';
    
    return crypto
      .createHmac('sha256', this.clientSecret)
      .update(username + this.clientId)
      .digest('base64');
  }

  private mapCognitoAttributesToUser(attributes: any[]): Partial<User> {
    const user: Partial<User> = {};
    
    attributes.forEach((attr) => {
      switch (attr.Name) {
        case 'sub':
          user.id = attr.Value;
          break;
        case 'email':
          user.email = attr.Value;
          break;
        case 'email_verified':
          user.emailVerified = attr.Value === 'true';
          break;
        case 'given_name':
          user.firstName = attr.Value;
          break;
        case 'family_name':
          user.lastName = attr.Value;
          break;
        case 'phone_number':
          user.phoneNumber = attr.Value;
          break;
      }
    });
    
    return user;
  }

  async signUp(data: SignUpRequest): Promise<{ userId: string; userConfirmed: boolean }> {
    try {
      // Step 1: Create user with AdminCreateUserCommand to have admin privileges
      const userAttributes = [
        { Name: 'email', Value: data.email },
        { Name: 'email_verified', Value: 'true' },
        ...(data.firstName ? [{ Name: 'given_name', Value: data.firstName }] : []),
        ...(data.lastName ? [{ Name: 'family_name', Value: data.lastName }] : []),
        ...(data.phoneNumber ? [
          { Name: 'phone_number', Value: data.phoneNumber },
          { Name: 'phone_number_verified', Value: 'true' }
        ] : []),
      ];

      const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: this.userPoolId,
        Username: data.username,
        UserAttributes: userAttributes,
        MessageAction: MessageActionType.SUPPRESS, // Don't send welcome email
      });

      const createUserResponse = await this.client.send(createUserCommand);

      // Step 2: Set permanent password (this also confirms the user account)
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: this.userPoolId,
        Username: data.username,
        Password: data.password,
        Permanent: true, // Set as permanent password, not temporary
      });

      await this.client.send(setPasswordCommand);

      logger.info(`User ${data.username} signed up successfully with confirmed account`);

      return {
        userId: createUserResponse.User?.Attributes?.find(attr => attr.Name === 'sub')?.Value!,
        userConfirmed: true, // Always true now since we're using admin commands
      };
    } catch (error) {
      logger.error('Error signing up user:', error);
      throw error;
    }
  }

  async signIn(data: SignInRequest): Promise<SignInResponse> {
    try {
      const secretHash = this.calculateSecretHash(data.username);
      
      const command = new InitiateAuthCommand({
        ClientId: this.clientId,
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        AuthParameters: {
          USERNAME: data.username,
          PASSWORD: data.password,
          ...(secretHash && { SECRET_HASH: secretHash }),
        },
      });

      const response = await this.client.send(command);
      
      if (!response.AuthenticationResult) {
        throw new Error('Authentication failed');
      }

      const getUserCommand = new GetUserCommand({
        AccessToken: response.AuthenticationResult.AccessToken!,
      });
      
      const userResponse = await this.client.send(getUserCommand);
      
      const user = this.mapCognitoAttributesToUser(userResponse.UserAttributes || []);
      
      logger.info(`User ${data.username} signed in successfully`);
      
      return {
        user: {
          ...user,
          username: userResponse.Username!,
        } as User,
        tokens: {
          accessToken: response.AuthenticationResult.AccessToken!,
          idToken: response.AuthenticationResult.IdToken!,
          refreshToken: response.AuthenticationResult.RefreshToken!,
        },
      };
    } catch (error) {
      logger.error('Error signing in user:', error);
      throw error;
    }
  }

  async verifyEmail(data: VerifyEmailRequest): Promise<void> {
    try {
      const secretHash = this.calculateSecretHash(data.username);
      
      const command = new ConfirmSignUpCommand({
        ClientId: this.clientId,
        Username: data.username,
        ConfirmationCode: data.code,
        SecretHash: secretHash || undefined,
      });

      await this.client.send(command);
      
      logger.info(`Email verified for user ${data.username}`);
    } catch (error) {
      logger.error('Error verifying email:', error);
      throw error;
    }
  }

  async resendVerificationCode(username: string): Promise<void> {
    try {
      const secretHash = this.calculateSecretHash(username);
      
      const command = new ResendConfirmationCodeCommand({
        ClientId: this.clientId,
        Username: username,
        SecretHash: secretHash || undefined,
      });

      await this.client.send(command);
      
      logger.info(`Verification code resent for user ${username}`);
    } catch (error) {
      logger.error('Error resending verification code:', error);
      throw error;
    }
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    try {
      const secretHash = this.calculateSecretHash(data.username);
      
      const command = new ForgotPasswordCommand({
        ClientId: this.clientId,
        Username: data.username,
        SecretHash: secretHash || undefined,
      });

      await this.client.send(command);
      
      logger.info(`Password reset initiated for user ${data.username}`);
    } catch (error) {
      logger.error('Error initiating password reset:', error);
      throw error;
    }
  }

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    try {
      const secretHash = this.calculateSecretHash(data.username);
      
      const command = new ConfirmForgotPasswordCommand({
        ClientId: this.clientId,
        Username: data.username,
        ConfirmationCode: data.code,
        Password: data.newPassword,
        SecretHash: secretHash || undefined,
      });

      await this.client.send(command);
      
      logger.info(`Password reset completed for user ${data.username}`);
    } catch (error) {
      logger.error('Error resetting password:', error);
      throw error;
    }
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      const command = new ChangePasswordCommand({
        AccessToken: data.accessToken,
        PreviousPassword: data.previousPassword,
        ProposedPassword: data.newPassword,
      });

      await this.client.send(command);
      
      logger.info('Password changed successfully');
    } catch (error) {
      logger.error('Error changing password:', error);
      throw error;
    }
  }

  async getUser(accessToken: string): Promise<User> {
    try {
      const command = new GetUserCommand({
        AccessToken: accessToken,
      });

      const response = await this.client.send(command);
      
      const user = this.mapCognitoAttributesToUser(response.UserAttributes || []);
      
      return {
        ...user,
        username: response.Username!,
      } as User;
    } catch (error) {
      logger.error('Error getting user:', error);
      throw error;
    }
  }

  async updateProfile(accessToken: string, data: UpdateProfileRequest): Promise<void> {
    try {
      const attributes = [];
      
      if (data.firstName !== undefined) {
        attributes.push({ Name: 'given_name', Value: data.firstName });
      }
      if (data.lastName !== undefined) {
        attributes.push({ Name: 'family_name', Value: data.lastName });
      }
      if (data.phoneNumber !== undefined) {
        attributes.push({ Name: 'phone_number', Value: data.phoneNumber });
      }

      if (attributes.length === 0) {
        return;
      }

      const command = new UpdateUserAttributesCommand({
        AccessToken: accessToken,
        UserAttributes: attributes,
      });

      await this.client.send(command);
      
      logger.info('User profile updated successfully');
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  async deleteUser(accessToken: string): Promise<void> {
    try {
      const command = new DeleteUserCommand({
        AccessToken: accessToken,
      });

      await this.client.send(command);
      
      logger.info('User deleted successfully');
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  async refreshToken(data: RefreshTokenRequest): Promise<SignInResponse> {
    try {
      const command = new InitiateAuthCommand({
        ClientId: this.clientId,
        AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
        AuthParameters: {
          REFRESH_TOKEN: data.refreshToken,
        },
      });

      const response = await this.client.send(command);
      
      if (!response.AuthenticationResult) {
        throw new Error('Token refresh failed');
      }

      const getUserCommand = new GetUserCommand({
        AccessToken: response.AuthenticationResult.AccessToken!,
      });
      
      const userResponse = await this.client.send(getUserCommand);
      
      const user = this.mapCognitoAttributesToUser(userResponse.UserAttributes || []);
      
      return {
        user: {
          ...user,
          username: userResponse.Username!,
        } as User,
        tokens: {
          accessToken: response.AuthenticationResult.AccessToken!,
          idToken: response.AuthenticationResult.IdToken!,
          refreshToken: data.refreshToken,
        },
      };
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw error;
    }
  }

  async signOut(accessToken: string): Promise<void> {
    try {
      const command = new GlobalSignOutCommand({
        AccessToken: accessToken,
      });

      await this.client.send(command);
      
      logger.info('User signed out successfully');
    } catch (error) {
      logger.error('Error signing out user:', error);
      throw error;
    }
  }

  async listUsers(limit?: number, paginationToken?: string): Promise<{ users: User[]; nextToken?: string }> {
    try {
      const command = new ListUsersCommand({
        UserPoolId: this.userPoolId,
        Limit: limit || 20,
        PaginationToken: paginationToken,
      });

      const response = await this.client.send(command);
      
      const users = response.Users?.map((user) => {
        const mappedUser = this.mapCognitoAttributesToUser(user.Attributes || []);
        return {
          ...mappedUser,
          username: user.Username!,
          emailVerified: user.UserStatus === 'CONFIRMED',
          createdAt: user.UserCreateDate,
          updatedAt: user.UserLastModifiedDate,
        } as User;
      }) || [];
      
      return {
        users,
        nextToken: response.PaginationToken,
      };
    } catch (error) {
      logger.error('Error listing users:', error);
      throw error;
    }
  }

  async adminCreateUser(
    username: string,
    email: string,
    temporaryPassword: string,
    sendEmail: boolean = true
  ): Promise<User> {
    try {
      const command = new AdminCreateUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
        ],
        TemporaryPassword: temporaryPassword,
        MessageAction: sendEmail ? MessageActionType.SUPPRESS : undefined,
      });

      const response = await this.client.send(command);
      
      const user = this.mapCognitoAttributesToUser(response.User?.Attributes || []);
      
      logger.info(`Admin created user ${username}`);
      
      return {
        ...user,
        username: response.User?.Username!,
      } as User;
    } catch (error) {
      logger.error('Error creating user as admin:', error);
      throw error;
    }
  }

  async adminDeleteUser(username: string): Promise<void> {
    try {
      const command = new AdminDeleteUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });

      await this.client.send(command);
      
      logger.info(`Admin deleted user ${username}`);
    } catch (error) {
      logger.error('Error deleting user as admin:', error);
      throw error;
    }
  }
}