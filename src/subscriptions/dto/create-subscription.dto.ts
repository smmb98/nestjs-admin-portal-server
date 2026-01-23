import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateSubscriptionDto {
  @IsNotEmpty()
  @IsNumber()
  organizationId: number;

  @IsNotEmpty()
  @IsString()
  planName: string;
}
