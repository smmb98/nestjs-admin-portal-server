import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('progress')
@ApiBearerAuth('JWT-auth')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Roles('ORG_ADMIN')
  @Get('org/progress/students')
  @ApiOperation({
    summary: 'Get progress for all students in the organization',
  })
  @ApiResponse({ status: 200, description: 'Students progress data' })
  async getStudentsProgress(@Request() req: any) {
    const orgId = req.user.organization.id;
    return this.progressService.getStudentsProgressForOrg(orgId);
  }

  @Roles('ORG_ADMIN')
  @Get('org/progress/summary')
  @ApiOperation({ summary: 'Get progress summary for the organization' })
  @ApiResponse({ status: 200, description: 'Organization progress summary' })
  async getOrgProgressSummary(@Request() req: any) {
    const orgId = req.user.organization.id;
    return this.progressService.getOrgProgressSummary(orgId);
  }

  @Roles('STUDENT')
  @Get('student/progress')
  @ApiOperation({ summary: 'Get progress for the current student' })
  @ApiResponse({ status: 200, description: 'Student progress data' })
  async getStudentProgress(@Request() req: any) {
    const studentId = req.user.id;
    return this.progressService.getStudentProgress(studentId);
  }
}
