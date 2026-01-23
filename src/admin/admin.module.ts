import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Organization } from '../entities/Organization';
import { OrganizationsModule } from './organizations/organizations.module';
import { LicensesModule } from './licenses/licenses.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([Organization]),
    OrganizationsModule,
    LicensesModule,
  ],
})
export class AdminModule {}
