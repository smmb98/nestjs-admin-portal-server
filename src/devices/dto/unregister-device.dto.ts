import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UnregisterDeviceDto {
  @ApiProperty({
    description: 'Unique identifier for the device to unregister',
    example: 'uuid-1234-5678',
  })
  @IsString()
  @IsNotEmpty()
  deviceUuid!: string;
}
