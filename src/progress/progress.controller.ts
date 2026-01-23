import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Roles('ORG_ADMIN')
  @Get('org/progress/students')
  async getStudentsProgress(@Request() req) {
    const orgId = req.user.organization.id;
    return this.progressService.getStudentsProgressForOrg(orgId);
  }

  @Roles('ORG_ADMIN')
  @Get('org/progress/summary')
  async getOrgProgressSummary(@Request() req) {
    const orgId = req.user.organization.id;
    return this.progressService.getOrgProgressSummary(orgId);
  }

  @Roles('STUDENT')
  @Get('student/progress')
  async getStudentProgress(@Request() req) {
    const studentId = req.user.id;
    return this.progressService.getStudentProgress(studentId);
  }
}
