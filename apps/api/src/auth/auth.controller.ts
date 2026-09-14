import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { AuthService } from "./auth.service.js";
import { RegisterDto, LoginDto } from "./dto/auth.dto.js";

type AuthedUser = { id: string; email: string; name: string | null; googleId: string | null };

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post("login")
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("me")
  me(@Req() req: Request & { user: AuthedUser }) {
    return req.user;
  }

  // --- Google OAuth (routes active once GOOGLE_CLIENT_ID/SECRET are set) ---

  @UseGuards(AuthGuard("google"))
  @Get("google")
  googleAuth() {
    // Passport redirects to Google's consent screen.
  }

  @UseGuards(AuthGuard("google"))
  @Get("google/callback")
  googleCallback(@Req() req: Request & { user: AuthedUser }) {
    // Same JWT as email+password login — one token shape for all providers.
    return this.auth.googleCallbackToken(req.user);
  }
}
