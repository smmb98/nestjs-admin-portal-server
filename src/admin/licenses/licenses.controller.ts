import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { LicensesService } from './licenses.service';
import { BulkCreateLicensesDto } from './dto/bulk-create-licenses.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('admin/licenses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Post('bulk')
  bulkCreate(@Body() bulkCreateLicensesDto: BulkCreateLicensesDto) {
    return this.licensesService.bulkCreate(bulkCreateLicensesDto);
  }

  @Get()
  findAll() {
    return this.licensesService.findAll();
  }

  @Patch(':id/suspend')
  suspend(@Param('id', ParseIntPipe) id: number) {
    return this.licensesService.update(id, { status: 'SUSPENDED' });
  }

  @Patch(':id/revoke')
  revoke(@Param('id', ParseIntPipe) id: number) {
    return this.licensesService.update(id, { status: 'REVOKED' });
  }
}
