import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from '../entities/User';
import { License } from '../entities/License';
import { LicenseAssignment } from '../entities/LicenseAssignment';
import { StudentsModule } from './students/students.module';
import { LicensesModule } from './licenses/licenses.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([User, License, LicenseAssignment]),
    StudentsModule,
    LicensesModule,
  ],
})
export class OrgModule {}
