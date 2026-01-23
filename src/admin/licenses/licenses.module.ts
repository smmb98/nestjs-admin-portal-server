import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { License } from '../../entities/License';
import { Organization } from '../../entities/Organization';
import { LicensesService } from './licenses.service';
import { LicensesController } from './licenses.controller';

@Module({
  imports: [MikroOrmModule.forFeature([License, Organization])],
  controllers: [LicensesController],
  providers: [LicensesService],
})
export class LicensesModule {}
