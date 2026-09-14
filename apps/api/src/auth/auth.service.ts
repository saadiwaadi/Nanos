import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service.js";
import { RegisterDto, LoginDto } from "./dto/auth.dto.js";
import type { JwtPayload } from "./jwt.strategy.js";

const PASSWORD_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, googleId: true },
    });

    if (existing?.googleId) {
      // Deliberate policy: a Google account never gains a password implicitly.
      // Anyone knowing the email could otherwise claim the account.
      throw new ConflictException(
        "This email is registered with Google. Please sign in with Google.",
      );
    }
    if (existing) {
      throw new ConflictException("An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_ROUNDS);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, password: passwordHash },
      select: { id: true, email: true, name: true },
    });
    return this.issueToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user?.password) {
      if (user) {
        // Exists but password-less ⇒ registered via Google.
        throw new ConflictException(
          "This email is registered with Google. Please sign in with Google.",
        );
      }
      // Same generic error for unknown email — no account enumeration.
      throw new UnauthorizedException("Invalid credentials");
    }

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    return this.issueToken({ id: user.id, email: user.email, name: user.name });
  }

  /** Used by the Google OAuth callback to issue the same JWT shape. */
  googleCallbackToken(user: { id: string; email: string; name: string | null }) {
    return this.issueToken(user);
  }

  private issueToken(user: { id: string; email: string; name: string | null }) {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwt.sign(payload),
      user: { id: user.id, email: user.email, name: user.name },
    };
  }
}
