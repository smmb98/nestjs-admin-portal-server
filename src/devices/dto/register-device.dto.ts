import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDeviceDto {
  @ApiProperty({
    description: 'Unique identifier for the device',
    example: 'uuid-1234-5678',
  })
  @IsString()
  @IsNotEmpty()
  deviceUuid: string;

  @ApiProperty({ description: 'Type of the device', example: 'mobile' })
  @IsString()
  @IsNotEmpty()
  deviceType: string;
}
