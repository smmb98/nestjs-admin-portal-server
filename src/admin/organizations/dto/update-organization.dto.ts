import { IsEnum } from 'class-validator';

export class UpdateOrganizationDto {
  @IsEnum(['ACTIVE', 'SUSPENDED'])
  status: 'ACTIVE' | 'SUSPENDED';
}