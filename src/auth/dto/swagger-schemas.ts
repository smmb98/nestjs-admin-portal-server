import { ApiProperty } from '@nestjs/swagger';

export class UserResponseSchema {
  @ApiProperty({ description: 'User ID' })
  id: number;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ enum: ['ADMIN', 'ORG_ADMIN', 'STUDENT'] })
  role: string;

  @ApiProperty({ description: 'Organization ID', nullable: true })
  organizationId?: number;
}

export class LoginResponseSchema {
  @ApiProperty({ description: 'JWT access token for API authentication' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token for obtaining new access tokens' })
  refreshToken: string;

  @ApiProperty({
    description: 'Token validity duration in seconds',
    example: 900,
  })
  expiresInSeconds: number;

  @ApiProperty({ description: 'Token type', example: 'Bearer' })
  tokenType: string;

  @ApiProperty({
    description: 'Authenticated user information',
    type: UserResponseSchema,
  })
  user: UserResponseSchema;
}

export class RefreshTokenResponseSchema {
  @ApiProperty({ description: 'New JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'New refresh token' })
  refreshToken: string;

  @ApiProperty({
    description: 'Token validity duration in seconds',
    example: 900,
  })
  expiresInSeconds: number;

  @ApiProperty({ description: 'Token type', example: 'Bearer' })
  tokenType: string;
}

export class ErrorResponseSchema {
  @ApiProperty({ description: 'Error status code' })
  statusCode: number;

  @ApiProperty({ description: 'Error message' })
  message: string;

  @ApiProperty({ description: 'Error timestamp' })
  timestamp: string;

  @ApiProperty({ description: 'Request path' })
  path: string;
}
