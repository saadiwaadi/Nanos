import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

let failedAttempts = 0;
let lockedUntil: number | null = null;

@Injectable()
export class AdminAuthService {
  constructor(private jwtService: JwtService) {}

  async login(email: string, password: string): Promise<string> {
    if (lockedUntil && lockedUntil > Date.now()) {
      throw new ForbiddenException('Too many failed attempts. Try again later.');
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminEmail || !adminHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const emailMatches = email === adminEmail;
    const passwordMatches = emailMatches ? await bcrypt.compare(password, adminHash) : false;

    if (!emailMatches || !passwordMatches) {
      failedAttempts++;
      if (failedAttempts >= MAX_ATTEMPTS) {
        lockedUntil = Date.now() + LOCK_MS;
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    failedAttempts = 0;
    lockedUntil = null;

    return this.jwtService.sign({ sub: 'admin', role: 'ADMIN' });
  }
}
