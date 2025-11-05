export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  attributes?: Record<string, string>;
}

export interface SignUpRequest {
  email: string;
  password: string;
  username: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface SignInRequest {
  username: string;
  password: string;
}

export interface SignInResponse {
  user: User;
  tokens: {
    accessToken: string;
    idToken: string;
    refreshToken: string;
  };
}

export interface VerifyEmailRequest {
  username: string;
  code: string;
}

export interface ForgotPasswordRequest {
  username: string;
}

export interface ResetPasswordRequest {
  username: string;
  code: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  accessToken: string;
  previousPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}