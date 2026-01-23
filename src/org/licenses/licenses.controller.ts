import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LicensesService } from './licenses.service';
import { AssignLicenseDto } from './dto/assign-license.dto';
import { RevokeLicenseDto } from './dto/revoke-license.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@ApiTags('licenses')
@ApiBearerAuth('JWT-auth')
@Controller('org/licenses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ORG_ADMIN')
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Post('assign')
  @ApiOperation({ summary: 'Assign a license to a student' })
  @ApiResponse({ status: 201, description: 'License assigned successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  assign(@Body() assignLicenseDto: AssignLicenseDto, @Request() req) {
    return this.licensesService.assign(assignLicenseDto, req.user.id);
  }

  @Post('revoke')
  @ApiOperation({ summary: 'Revoke a license from a student' })
  @ApiResponse({ status: 200, description: 'License revoked successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  revoke(@Body() revokeLicenseDto: RevokeLicenseDto, @Request() req) {
    return this.licensesService.revoke(revokeLicenseDto, req.user.id);
  }
}
