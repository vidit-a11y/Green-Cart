import dotenv from 'dotenv';
dotenv.config();

/**
 * Environment Validation
 *
 * Validates that all required environment variables are present at startup.
 * Fails fast with a clear error message rather than crashing later with
 * a cryptic "Cannot read property of undefined".
 */

const required = ['MONGO_URI', 'JWT_SECRET'] as const;

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  console.error('   Check your .env file against .env.example');
  process.exit(1);
}

// Typed environment exports — use these instead of process.env directly
export const env = {
  PORT: process.env.PORT || '5001',
  MONGO_URI: process.env.MONGO_URI as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLOUD_NAME: process.env.CLOUD_NAME,
  API_KEY: process.env.API_KEY,
  API_SECRET: process.env.API_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
} as const;
