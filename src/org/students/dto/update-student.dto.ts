import { IsEmail, IsOptional, IsEnum } from 'class-validator';

export class UpdateStudentDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(['ACTIVE', 'SUSPENDED'])
  @IsOptional()
  status?: 'ACTIVE' | 'SUSPENDED';
}
