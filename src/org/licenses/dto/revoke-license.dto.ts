import { IsNumber, IsNotEmpty } from 'class-validator';

export class RevokeLicenseDto {
  @IsNumber()
  @IsNotEmpty()
  studentId: number;

  @IsNumber()
  @IsNotEmpty()
  licenseId: number;
}
