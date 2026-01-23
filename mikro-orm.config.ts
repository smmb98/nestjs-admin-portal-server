import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { config as loadEnv } from 'dotenv';

loadEnv();
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

const config: Options = {
  driver: PostgreSqlDriver,
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
  ],
  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
  },
};

export default config;
