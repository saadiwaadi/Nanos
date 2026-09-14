import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { JwtStrategy } from "./jwt.strategy.js";
import { GoogleStrategy } from "./google.strategy.js";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      global: true,
      signOptions: { expiresIn: "7d" },
      secret: process.env.JWT_SECRET ?? "",
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
})
export class AuthModule {}
