import { IsEnum } from 'class-validator';

export class UpdateLicenseDto {
  @IsEnum(['SUSPENDED', 'REVOKED'])
  status!: 'SUSPENDED' | 'REVOKED';
}
