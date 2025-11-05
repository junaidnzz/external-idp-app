# Bulk User Creation Script

This script allows you to create multiple users in AWS Cognito through the signup API endpoint.

## Features

- ✅ Creates users with confirmed accounts
- ✅ Email automatically verified
- ✅ Phone number automatically verified
- ✅ Sequential username generation
- ✅ Configurable domains and ranges
- ✅ Rate limiting protection (100ms delay between requests)

## Usage

### Method 1: Using Preset Configurations (Recommended)

The script comes with preset configurations for all required domains:

```bash
npm run bulk-create-users
```

This will create users for all preset domains:
- `airfly.ae` (1-15 users)
- `airflyorg.ae` (1-15 users)
- `syneratech.com` (1-15 users)
- `novatech.ae` (1-15 users)

### Method 2: Command Line Arguments

Create users for a specific domain and range:

```bash
npm run bulk-create-users -- <domain> <start> <end>
```

**Examples:**

```bash
# Create users 1-15 for airfly.ae
npm run bulk-create-users -- airfly.ae 1 15

# Create users 5-10 for syneratech.com
npm run bulk-create-users -- syneratech.com 5 10

# Create users 1-20 for custom domain
npm run bulk-create-users -- example.com 1 20
```

## Configuration

Open `scripts/bulk-create-users.ts` to modify:

### 1. API Base URL

```typescript
const API_BASE_URL = 'http://localhost:4000/api';
```

### 2. Default User Data

```typescript
const DEFAULT_CONFIG = {
  firstName: 'John',
  lastName: 'Doe',
  password: 'Test@123456', // Must meet Cognito password requirements
  phoneNumberPrefix: '+971', // UAE country code
};
```

### 3. Domain Configurations

```typescript
const DOMAIN_CONFIGS = [
  { domain: 'airfly.ae', shortName: 'airfly', count: 15 },
  { domain: 'airflyorg.ae', shortName: 'airflyorg', count: 15 },
  { domain: 'syneratech.com', shortName: 'syneratech', count: 15 },
  { domain: 'novatech.ae', shortName: 'novatech', count: 15 },
];
```

## Generated User Format

For domain `airfly.ae` with number `1`:

- **Email**: `john.doe1@airfly.ae`
- **Username**: `john.doe1airfly`
- **First Name**: `John`
- **Last Name**: `Doe1`
- **Password**: `Test@123456`
- **Phone**: `+971500000001`

## Password Requirements

The default password must meet AWS Cognito requirements:
- Minimum 8 characters
- Contains uppercase letter
- Contains lowercase letter
- Contains digit
- Contains special character (@$!%*?&)

## Prerequisites

1. Make sure your API server is running:
   ```bash
   npm run dev
   ```

2. Ensure AWS Cognito is properly configured in `.env` file

## Troubleshooting

### Error: "Username already exists"
- Users with the same username already exist
- Change the start number or delete existing users

### Error: "Invalid password"
- Password doesn't meet Cognito requirements
- Update `DEFAULT_CONFIG.password` with a compliant password

### Error: "Rate limit exceeded"
- Too many requests in a short time
- Increase delay in the script (change `setTimeout` value)

### Error: "Connection refused"
- API server is not running
- Start the server with `npm run dev`

## Notes

- Each user is created with a 100ms delay to avoid rate limiting
- All users are automatically confirmed and verified
- Phone numbers are generated sequentially starting from +971500000001
- You can remove phone number generation by commenting out the `phoneNumber` field
