import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'development-secret-change-me',
  nodeEnv: process.env.NODE_ENV || 'development',
  seedUsername: process.env.SEED_USERNAME || 'admin',
  seedPassword: process.env.SEED_PASSWORD || 'Admin123!',
  seedDisplayName: process.env.SEED_DISPLAY_NAME || 'Ing. Demo Tecnico',
  seedEmployeeNumber: process.env.SEED_EMPLOYEE_NUMBER || 'IDS-001',
};

export const DEV_JWT_SECRET = 'development-secret-change-me';

export function assertEnv() {
  if (!env.mongoUri) {
    throw new Error('MONGODB_URI is required to start the API server.');
  }

  // The dev fallback for JWT_SECRET is committed in this repo, so booting production with it
  // would let anyone who can read the source forge a session cookie. Fail loudly at boot
  // rather than silently signing tokens with a known secret.
  if (env.nodeEnv === 'production' && (!process.env.JWT_SECRET || env.jwtSecret === DEV_JWT_SECRET)) {
    throw new Error('JWT_SECRET must be set to a non-default value in production.');
  }
}
