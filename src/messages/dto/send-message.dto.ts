import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'The content of the message',
    example: 'Hello, world!',
  })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'ID of the recipient user', example: 1 })
  @IsOptional()
  @IsInt()
  recipientId?: number;

  @ApiPropertyOptional({ description: 'ID of the conversation', example: 1 })
  @IsOptional()
  @IsInt()
  conversationId?: number;

  @ApiPropertyOptional({
    description: 'Whether this is a broadcast message',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isBroadcast?: boolean;
}
