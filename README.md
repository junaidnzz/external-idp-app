# External IdP Application

A fully-featured Express TypeScript application that acts as an external Identity Provider (IdP) using AWS Cognito for user management. This application is designed to test SSO integration with your Core Direction application.

## Features

- Complete user authentication flow (signup, signin, email verification)
- Password management (forgot password, reset password, change password)
- User profile management
- JWT token-based authentication
- **OAuth2/OIDC authentication flow with web UI**
- Admin user management capabilities
- Rate limiting and security headers
- Input validation and error handling
- Structured logging
- Web interface for testing SSO flows

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- AWS Account with Cognito User Pool configured
- AWS credentials with appropriate permissions

## AWS Cognito Setup

1. **Create a Cognito User Pool:**
   ```bash
   aws cognito-idp create-user-pool \
     --pool-name "external-idp-users" \
     --auto-verified-attributes email \
     --username-attributes email \
     --mfa-configuration OFF \
     --email-configuration SourceArn=arn:aws:ses:region:account-id:identity/email@example.com
   ```

2. **Create an App Client with OAuth Support:**
   ```bash
   aws cognito-idp create-user-pool-client \
     --user-pool-id <your-user-pool-id> \
     --client-name "external-idp-app-client" \
     --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
     --supported-identity-providers COGNITO \
     --allowed-o-auth-flows code \
     --allowed-o-auth-scopes email openid phone profile \
     --callback-urls "http://localhost:3000/oauth/callback" \
     --logout-urls "http://localhost:3000" \
     --generate-secret
   ```

3. **Create a Cognito Domain for OAuth:**
   ```bash
   aws cognito-idp create-user-pool-domain \
     --domain "your-unique-domain-name" \
     --user-pool-id <your-user-pool-id>
   ```

4. **Note down:**
   - User Pool ID
   - Client ID
   - Client Secret (if generated)
   - AWS Region
   - Cognito Domain (from step 3)

## Installation

1. **Clone and navigate to the project:**
   ```bash
   cd external-idp-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file with your AWS Cognito configuration:**
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # AWS Configuration
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key

   # Cognito Configuration
   COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
   COGNITO_CLIENT_ID=your_client_id
   COGNITO_CLIENT_SECRET=your_client_secret  # Optional

   # JWT Configuration
   JWT_SECRET=your-strong-secret-key
   JWT_EXPIRATION=1d

   # CORS Configuration
   ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002

   # OAuth2/OIDC Configuration (for web UI)
   COGNITO_DOMAIN=your-cognito-domain  # From step 3 above
   OAUTH_CALLBACK_URL=http://localhost:3000/oauth/callback
   OAUTH_LOGOUT_URL=http://localhost:3000
   SESSION_SECRET=your-session-secret-change-in-production
   ```

## Running the Application

**Development mode:**
```bash
npm run dev
```

**Production build:**
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
- `GET /api/health` - Service health status
- `GET /api/ready` - Service readiness check

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - User login
- `POST /api/auth/verify-email` - Verify email with code
- `POST /api/auth/resend-verification/:username` - Resend verification code
- `POST /api/auth/forgot-password` - Initiate password reset
- `POST /api/auth/reset-password` - Complete password reset
- `POST /api/auth/change-password` - Change password (authenticated)
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/signout` - Sign out user (authenticated)

### User Management
- `GET /api/users/profile` - Get user profile (authenticated)
- `PUT /api/users/profile` - Update user profile (authenticated)
- `DELETE /api/users/account` - Delete user account (authenticated)
- `GET /api/users/list` - List all users (authenticated)
- `POST /api/users/admin/create` - Admin create user (authenticated)
- `DELETE /api/users/admin/:username` - Admin delete user (authenticated)

## API Usage Examples

### Sign Up
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "password": "Test@1234",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Sign In
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test@1234"
  }'
```

### Get Profile (Authenticated)
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <access_token>"
```

## Testing SSO Integration

Once this external IdP is running, you can configure it to act as a SAML or OIDC provider for your Core Direction application:

### For SAML Integration:
1. Set up AWS Cognito as a SAML IdP
2. Configure SAML attributes mapping
3. Export SAML metadata
4. Configure Core Direction Cognito to accept this IdP

### For OIDC Integration:
1. Configure OAuth 2.0 settings in Cognito
2. Set up redirect URIs
3. Configure Core Direction Cognito with OIDC provider details

## Security Features

- Helmet.js for security headers
- Rate limiting on authentication endpoints
- Input validation using express-validator
- JWT token verification
- CORS configuration
- Secure password requirements

## Project Structure

```
external-idp-app/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Express middlewares
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript types
│   ├── utils/          # Utility functions
│   ├── validators/     # Input validators
│   ├── app.ts          # Express app setup
│   └── server.ts       # Server entry point
├── .env.example        # Environment variables template
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript configuration
└── README.md           # Documentation
```

## Next Steps

1. **Phase 2:** Configure this app as an IdP provider with SAML/OIDC capabilities
2. **Phase 3:** Connect Core Direction AWS Cognito to accept this external IdP

## Troubleshooting

### Common Issues:

1. **"Missing required environment variables"**
   - Ensure all required environment variables are set in `.env`

2. **"InvalidPasswordException"**
   - Password must meet Cognito requirements (8+ chars, uppercase, lowercase, number, special char)

3. **"UsernameExistsException"**
   - Username is already taken, try a different one

4. **CORS errors**
   - Add your frontend URL to `ALLOWED_ORIGINS` in `.env`

## License

ISC