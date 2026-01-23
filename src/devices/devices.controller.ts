import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { UnregisterDeviceDto } from './dto/unregister-device.dto';
import { User } from '../entities/User';

@ApiTags('devices')
@ApiBearerAuth('JWT-auth')
@Controller('devices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a device for the student' })
  @ApiResponse({ status: 201, description: 'Device registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async registerDevice(
    @Body() registerDeviceDto: RegisterDeviceDto,
    @Request() req: any,
  ): Promise<{ message: string }> {
    const student: User = req.user;
    await this.devicesService.registerDevice(
      student,
      registerDeviceDto.deviceUuid,
      registerDeviceDto.deviceType,
    );
    return { message: 'Device registered successfully' };
  }

  @Post('unregister')
  @ApiOperation({ summary: 'Unregister a device for the student' })
  @ApiResponse({ status: 200, description: 'Device unregistered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async unregisterDevice(
    @Body() unregisterDeviceDto: UnregisterDeviceDto,
    @Request() req: any,
  ): Promise<{ message: string }> {
    const student: User = req.user;
    await this.devicesService.unregisterDevice(
      student,
      unregisterDeviceDto.deviceUuid,
    );
    return { message: 'Device unregistered successfully' };
  }
}
