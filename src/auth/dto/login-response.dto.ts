export class LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  tokenType: string = 'Bearer';
  user: {
    id: number;
    email: string;
    role: string;
    organizationId?: number;
  };
}
