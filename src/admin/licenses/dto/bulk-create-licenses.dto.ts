import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsInt,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';

class CreateLicenseDto {
  @IsInt()
  @IsNotEmpty()
  organizationId: number;

  @IsDate()
  @Type(() => Date)
  expiresAt: Date;
}

export class BulkCreateLicensesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLicenseDto)
  licenses: CreateLicenseDto[];
}
