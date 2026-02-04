import { defineConfig } from '@mikro-orm/postgresql';
import { config as loadEnv } from 'dotenv';

loadEnv();

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
  throw new Error(
    'DATABASE_URL environment variable is required and must not be empty. Please provide a valid database connection string.',
  );
}

import { Organization } from './src/entities/Organization';
import { User } from './src/entities/User';
import { License } from './src/entities/License';
import { LicenseAssignment } from './src/entities/LicenseAssignment';
import { Device } from './src/entities/Device';
import { DeviceAccount } from './src/entities/DeviceAccount';
import { StudentProgress } from './src/entities/StudentProgress';
import { TimeTracking } from './src/entities/TimeTracking';
import { Subscription } from './src/entities/Subscription';
import { Payment } from './src/entities/Payment';
import { Message } from './src/entities/Message';
import { Conversation } from './src/entities/Conversation';
import { RefreshToken } from './src/entities/RefreshToken';

const config = defineConfig({
  clientUrl: process.env.DATABASE_URL,
  entities: [
    Organization,
    User,
    License,
    LicenseAssignment,
    Device,
    DeviceAccount,
    StudentProgress,
    TimeTracking,
    Subscription,
    Payment,
    Message,
    Conversation,
    RefreshToken,
  ],
  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
  },
});

export default config;
