import { IsNumber, IsNotEmpty } from 'class-validator';

export class AssignLicenseDto {
  @IsNumber()
  @IsNotEmpty()
  studentId: number;

  @IsNumber()
  @IsNotEmpty()
  licenseId: number;
}
