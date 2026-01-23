import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class SendMessageDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsInt()
  recipientId?: number;

  @IsOptional()
  @IsInt()
  conversationId?: number;

  @IsOptional()
  @IsBoolean()
  isBroadcast?: boolean;
}
