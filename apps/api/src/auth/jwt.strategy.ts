import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-jwt";
import { PrismaService } from "../prisma/prisma.service.js";

export type JwtPayload = { sub: string; email: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: extractBearer,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? "",
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, googleId: true },
    });
    if (!user) throw new UnauthorizedException();
    return user; // attached to req.user; NEVER includes password
  }
}

export function extractBearer(req: {
  headers?: Record<string, string | string[] | undefined>;
}): string | null {
  const header = req.headers?.["authorization"];
  if (typeof header !== "string") return null;
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" ? (token ?? null) : null;
}
