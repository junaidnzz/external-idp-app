import { body, param } from 'express-validator';

export const signUpValidator = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('username')
    .isLength({ min: 3, max: 20 })
    .isAlphanumeric()
    .withMessage('Username must be 3-20 alphanumeric characters'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .isAlpha()
    .withMessage('First name must contain only letters'),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .isAlpha()
    .withMessage('Last name must contain only letters'),
  body('phoneNumber')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
];

export const signInValidator = [
  body('username')
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const verifyEmailValidator = [
  body('username')
    .notEmpty()
    .withMessage('Username is required'),
  body('code')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Verification code must be 6 digits'),
];

export const forgotPasswordValidator = [
  body('username')
    .notEmpty()
    .withMessage('Username is required'),
];

export const resetPasswordValidator = [
  body('username')
    .notEmpty()
    .withMessage('Username is required'),
  body('code')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Verification code must be 6 digits'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
];

export const changePasswordValidator = [
  body('previousPassword')
    .notEmpty()
    .withMessage('Previous password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
];

export const updateProfileValidator = [
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .isAlpha()
    .withMessage('First name must contain only letters'),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .isAlpha()
    .withMessage('Last name must contain only letters'),
  body('phoneNumber')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
];

export const refreshTokenValidator = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
];

export const adminCreateUserValidator = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .isAlphanumeric()
    .withMessage('Username must be 3-20 alphanumeric characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('temporaryPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
  body('sendEmail')
    .optional()
    .isBoolean()
    .withMessage('Send email must be a boolean'),
];

export const usernameParamValidator = [
  param('username')
    .notEmpty()
    .withMessage('Username is required'),
];