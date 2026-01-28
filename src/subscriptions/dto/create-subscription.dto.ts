import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'ID of the organization', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  organizationId!: number;

  @ApiProperty({
    description: 'Name of the subscription plan',
    example: 'Premium Plan',
  })
  @IsNotEmpty()
  @IsString()
  planName!: string;
}
