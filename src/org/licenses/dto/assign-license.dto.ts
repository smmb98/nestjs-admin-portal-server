import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignLicenseDto {
  @ApiProperty({
    description: 'ID of the student to assign the license to',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  studentId!: number;

  @ApiProperty({ description: 'ID of the license to assign', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  licenseId!: number;
}
