import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/postgresql';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/User';
import { License } from '../entities/License';

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

  async login(user: User): Promise<{ access_token: string }> {
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

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async logout(): Promise<{ message: string }> {
    // Since JWT is stateless, logout is handled on client side by removing token
    return await Promise.resolve({ message: 'Logged out successfully' });
  }
}
