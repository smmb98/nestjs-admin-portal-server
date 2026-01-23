import { IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStudentDto {
  @ApiPropertyOptional({
    description: 'Email address of the student',
    example: 'student@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Status of the student',
    enum: ['ACTIVE', 'SUSPENDED'],
    example: 'ACTIVE',
  })
  @IsEnum(['ACTIVE', 'SUSPENDED'])
  @IsOptional()
  status?: 'ACTIVE' | 'SUSPENDED';
}
