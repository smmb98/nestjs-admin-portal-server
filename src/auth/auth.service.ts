import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/postgresql';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User } from '../entities/User';
import { License } from '../entities/License';
import { RefreshToken } from '../entities/RefreshToken';
import { LoginResponseDto } from './dto/login-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly em: EntityManager,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.em.findOne(User, { email });
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      return user;
    }
    return null;
  }

  async login(
    user: User,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<LoginResponseDto> {
    // Check license validation
    if (user.organization) {
      const license = await this.em.findOne(License, {
        organization: user.organization,
      });
      if (
        !license ||
        license.status !== 'ACTIVE' ||
        license.expiresAt < new Date()
      ) {
        throw new UnauthorizedException('License is not valid');
      }
    }

    const tokens = await this.generateTokens(user, userAgent, ipAddress);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresInSeconds: tokens.expiresInSeconds,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organization?.id,
      },
    };
  }

  async generateTokens(
    user: User,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresInSeconds: number;
  }> {
    // Generate access token with short expiration (15 minutes)
    const accessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization?.id,
    };

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      expiresIn: '15m',
    });

    // Generate refresh token with longer expiration (7 days)
    const refreshTokenValue = crypto.randomBytes(64).toString('hex');
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    // Store refresh token in database (store hashed version)
    const refreshToken = this.em.create(RefreshToken, {
      token: crypto
        .createHash('sha256')
        .update(refreshTokenValue)
        .digest('hex'),
      user: user,
      expiresAt: refreshTokenExpiry,
      userAgent,
      ipAddress,
    });
    await this.em.persistAndFlush(refreshToken);

    return {
      accessToken,
      refreshToken: refreshTokenValue, // Return raw value, store hashed
      expiresInSeconds: 900, // 15 minutes
    };
  }

  async refreshTokens(
    refreshTokenValue: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<LoginResponseDto> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(refreshTokenValue)
      .digest('hex');

    const storedToken = await this.em.findOne(RefreshToken, {
      token: hashedToken,
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Get user from token using reference
    const user = await this.em.findOne(User, { id: storedToken.user.id });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Revoke old refresh token
    storedToken.revokedAt = new Date();
    storedToken.revokedBy = 'refresh';
    await this.em.persistAndFlush(storedToken);

    // Generate new tokens
    const tokens = await this.generateTokens(user, userAgent, ipAddress);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresInSeconds: tokens.expiresInSeconds,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organization?.id,
      },
    };
  }

  async revokeRefreshToken(tokenId: number, userId: number): Promise<void> {
    const token = await this.em.findOne(RefreshToken, {
      id: tokenId,
      user: userId,
    });

    if (token) {
      token.revokedAt = new Date();
      token.revokedBy = 'logout';
      await this.em.persistAndFlush(token);
    }
  }

  async revokeAllUserTokens(userId: number): Promise<void> {
    const tokens = await this.em.find(RefreshToken, {
      user: { id: userId },
      revokedAt: null,
    });

    for (const token of tokens) {
      token.revokedAt = new Date();
      token.revokedBy = 'logout_all';
    }
    await this.em.persistAndFlush(tokens);
  }

  async logout(
    userId: number,
    refreshTokenValue?: string,
  ): Promise<{ message: string }> {
    if (refreshTokenValue) {
      const hashedToken = crypto
        .createHash('sha256')
        .update(refreshTokenValue)
        .digest('hex');
      const token = await this.em.findOne(RefreshToken, { token: hashedToken });
      if (token) {
        await this.revokeRefreshToken(token.id, userId);
      }
    } else {
      await this.revokeAllUserTokens(userId);
    }

    return { message: 'Logged out successfully' };
  }
}
