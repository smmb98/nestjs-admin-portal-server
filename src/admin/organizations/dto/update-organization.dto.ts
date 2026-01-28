import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrganizationDto {
  @ApiProperty({
    description: 'The status of the organization',
    enum: ['ACTIVE', 'SUSPENDED'],
    example: 'SUSPENDED',
  })
  @IsEnum(['ACTIVE', 'SUSPENDED'])
  status!: 'ACTIVE' | 'SUSPENDED';
}
