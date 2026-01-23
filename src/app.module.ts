import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { OrgModule } from './org/org.module';
import { DevicesModule } from './devices/devices.module';
import { ProgressModule } from './progress/progress.module';
import { MessagesModule } from './messages/messages.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { Organization } from './entities/Organization';
import { User } from './entities/User';
import { License } from './entities/License';
import { LicenseAssignment } from './entities/LicenseAssignment';
import { Device } from './entities/Device';
import { DeviceAccount } from './entities/DeviceAccount';
import { StudentProgress } from './entities/StudentProgress';
import { TimeTracking } from './entities/TimeTracking';
import { Subscription } from './entities/Subscription';
import { Payment } from './entities/Payment';
import { Message } from './entities/Message';
import { Conversation } from './entities/Conversation';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MikroOrmModule.forRoot({
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
    }),
    AuthModule,
    AdminModule,
    OrgModule,
    DevicesModule,
    ProgressModule,
    MessagesModule,
    SubscriptionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
