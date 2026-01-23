import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RevokeLicenseDto {
  @ApiProperty({
    description: 'ID of the student to revoke the license from',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  studentId: number;

  @ApiProperty({ description: 'ID of the license to revoke', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  licenseId: number;
}
