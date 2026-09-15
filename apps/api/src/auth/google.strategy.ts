import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, type VerifyCallback } from "passport-google-oauth20";
import { PrismaService } from "../prisma/prisma.service.js";

export type GoogleProfile = {
  id: string;
  emails?: { value: string; verified: boolean }[];
  displayName?: string;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(private readonly prisma: PrismaService) {
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && !process.env.GOOGLE_CALLBACK_URL) {
      throw new Error('GOOGLE_CALLBACK_URL environment variable must be defined in production');
    }
    super({
      clientID: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ??
        'http://localhost:4000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  /**
   * Runs after Google verifies the user. Auto-links Google onto an existing
   * password account (Google verified the email), or creates a new
   * password-less account. The reverse (setting a password on a Google
   * account) is deliberately refused in AuthService — see linkPolicy.
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error("Google account has no email"));
      return;
    }

    const user = await this.prisma.user.upsert({
      where: { email },
      update: { googleId: profile.id },
      create: { email, name: profile.displayName, googleId: profile.id },
      select: { id: true, email: true, name: true, googleId: true },
    });

    done(null, user);
  }
}
