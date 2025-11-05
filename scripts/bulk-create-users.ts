#!/usr/bin/env ts-node
import axios from 'axios';

// ========================================
// CONFIGURATION - MODIFY THESE VALUES
// ========================================

const API_BASE_URL = 'http://localhost:4000/api';

// Hardcoded default values (you can modify these)
const DEFAULT_CONFIG = {
  firstName: 'John',
  lastName: 'Doe',
  password: 'StrongPassword@123', // Must meet password requirements
  phoneNumberPrefix: '+971', // UAE country code
};

// Domain configurations
const DOMAIN_CONFIGS = [
  // Org Related Domains
  // { domain: 'airfly.ae', shortName: 'airfly', startCount: 1 , endCount: 15 },
  { domain: 'airflyorg.ae', shortName: 'airflyorg', startCount: 1, endCount: 15 },

  // Org Unrelated Domains
  { domain: 'syneratech.com', shortName: 'syneratech', startCount: 1, endCount: 15 },
  { domain: 'novatech.ae', shortName: 'novatech', startCount: 1, endCount: 15 },
];

// ========================================
// HELPER FUNCTIONS
// ========================================

interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

/**
 * Generate phone number (optional, you can modify or remove)
 */
function generatePhoneNumber(index: number): string {
  const baseNumber = 500000000 + index;
  return `${DEFAULT_CONFIG.phoneNumberPrefix}${baseNumber}`;
}

/**
 * Create a single user via the signup API with retry logic
 */
async function createUser(userData: CreateUserRequest, retries = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await axios.post(`${API_BASE_URL}/auth/signup`, userData);
      console.log(`✅ Created user: ${userData.username} (${userData.email})`);
      return true;
    } catch (error: any) {
      // console.log(error);
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data.message || error.response.statusText;

        // If user already exists, skip and don't retry
        if (status === 409 || message.includes('UsernameExistsException')) {
          console.log(`⚠️  User ${userData.username} already exists, skipping...`);
          return false;
        }

        // For other errors, only log on the last attempt
        if (attempt === retries) {
          console.error(`❌ Failed to create ${userData.username}: ${message}`);
        }
      } else {
        if (attempt === retries) {
          console.error(`❌ Failed to create ${userData.username}: ${error.message}`);
        }
      }

      if (attempt === retries) {
        return false;
      }
    }
  }
  return false;
}

/**
 * Bulk create users for a specific domain
 */
async function bulkCreateUsers(
  domain: string,
  shortName: string,
  startNumber: number,
  endNumber: number
): Promise<{ success: number; failed: number; skipped: number }> {
  console.log(`\n🚀 Creating users for domain: ${domain}`);
  console.log(`   Range: ${startNumber} to ${endNumber}`);
  console.log(`   Total users to create: ${endNumber - startNumber + 1}\n`);

  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (let i = startNumber; i <= endNumber; i++) {
    const email = `john.doe${i}@${domain}`;
    const username = `johndoe${i}${shortName}`; // Alphanumeric only (no dots)

    const userData: CreateUserRequest = {
      email,
      username,
      password: DEFAULT_CONFIG.password,
      firstName: DEFAULT_CONFIG.firstName,
      lastName: DEFAULT_CONFIG.lastName, // Letters only (no numbers)
      phoneNumber: generatePhoneNumber(i), // Optional
    };

    const result = await createUser(userData);
    if (result === true) {
      successCount++;
    } else if (result === false) {
      // Check if it was skipped or failed based on the error message
      // For now, we'll count all false as failed, but skipped users are logged differently
      failedCount++;
    }
  }

  console.log(`\n📊 Summary for ${domain}:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failedCount}`);

  return { success: successCount, failed: failedCount, skipped: skippedCount };
}

/**
 * Parse command line arguments
 */
function parseArguments(): { domain?: string; shortName?: string; start: number; end: number } | null {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    return null; // Use preset configurations
  }

  if (args.length < 3) {
    console.error('❌ Invalid arguments. Usage:');
    console.error('   ts-node scripts/bulk-create-users.ts <domain> <start> <end>');
    console.error('   Example: ts-node scripts/bulk-create-users.ts airfly.ae 1 15');
    console.error('\n   Or run without arguments to use preset configurations');
    process.exit(1);
  }

  const domainInput = args[0];
  const start = parseInt(args[1], 10);
  const end = parseInt(args[2], 10);

  if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
    console.error('❌ Invalid start or end number');
    process.exit(1);
  }

  // Extract short name from domain (remove extension)
  const shortName = domainInput.split('.')[0];

  return { domain: domainInput, shortName, start, end };
}

// ========================================
// MAIN EXECUTION
// ========================================

async function main() {
  console.log('='.repeat(60));
  console.log('           BULK USER CREATION SCRIPT');
  console.log('='.repeat(60));

  const cmdArgs = parseArguments();
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  if (cmdArgs) {
    // Single domain from command line
    const result = await bulkCreateUsers(cmdArgs.domain!, cmdArgs.shortName!, cmdArgs.start, cmdArgs.end);
    totalSuccess = result.success;
    totalFailed = result.failed;
    totalSkipped = result.skipped;
  } else {
    // Use preset configurations
    console.log('\n📋 Using preset domain configurations:\n');

    for (const config of DOMAIN_CONFIGS) {
      const result = await bulkCreateUsers(config.domain, config.shortName, config.startCount, config.endCount);

      totalSuccess += result.success;
      totalFailed += result.failed;
      totalSkipped += result.skipped;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('           OVERALL SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Total Success: ${totalSuccess}`);
  console.log(`❌ Total Failed: ${totalFailed}`);
  console.log(`⚠️  Total Skipped: ${totalSkipped}`);
  console.log('='.repeat(60));
  console.log('✨ Bulk user creation completed!');
  console.log('='.repeat(60));
}

// Run the script
main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
