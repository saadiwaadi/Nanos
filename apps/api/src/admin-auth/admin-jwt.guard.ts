import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = req.cookies?.admin_token;
    if (!token) throw new UnauthorizedException('No admin session');
    try {
      const payload = this.jwtService.verify(token, { secret: process.env.ADMIN_JWT_SECRET });
      if (payload.role !== 'ADMIN') throw new UnauthorizedException();
      req.admin = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired admin session');
    }
  }
}
