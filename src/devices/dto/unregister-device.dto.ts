import { IsString, IsNotEmpty } from 'class-validator';

export class UnregisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  deviceUuid: string;
}
