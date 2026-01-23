import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { StudentProgress } from '../entities/StudentProgress';
import { TimeTracking } from '../entities/TimeTracking';
import { User } from '../entities/User';

@Module({
  imports: [MikroOrmModule.forFeature([StudentProgress, TimeTracking, User])],
  controllers: [ProgressController],
  providers: [ProgressService],
})
export class ProgressModule {}
