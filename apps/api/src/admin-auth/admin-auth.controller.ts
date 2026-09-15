import { Controller, Post, Body, Res, Get, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AdminAuthService } from './admin-auth.service.js';
import { AdminJwtGuard } from './admin-jwt.guard.js';

@Controller('auth/admin')
export class AdminAuthController {
  constructor(private adminAuth: AdminAuthService) {}

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.adminAuth.login(email, password);
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 60 * 60 * 1000,
    });
    return { ok: true };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('admin_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    return { ok: true };
  }

  @Get('me')
  @UseGuards(AdminJwtGuard)
  me() {
    return { role: 'ADMIN' };
  }
}
