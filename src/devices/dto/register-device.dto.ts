import { IsString, IsNotEmpty } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  deviceUuid: string;

  @IsString()
  @IsNotEmpty()
  deviceType: string;
}
