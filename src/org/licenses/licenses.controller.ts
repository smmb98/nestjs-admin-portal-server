import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { LicensesService } from './licenses.service';
import { AssignLicenseDto } from './dto/assign-license.dto';
import { RevokeLicenseDto } from './dto/revoke-license.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('org/licenses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ORG_ADMIN')
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Post('assign')
  assign(@Body() assignLicenseDto: AssignLicenseDto, @Request() req) {
    return this.licensesService.assign(assignLicenseDto, req.user.id);
  }

  @Post('revoke')
  revoke(@Body() revokeLicenseDto: RevokeLicenseDto, @Request() req) {
    return this.licensesService.revoke(revokeLicenseDto, req.user.id);
  }
}
