import { Module } from '@nestjs/common';
import { AdminSettingsController } from './admin-settings.controller.js';
import { AdminSettingsService } from './admin-settings.service.js';
import { AdminAuthModule } from '../admin-auth/admin-auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [AdminAuthModule, PrismaModule],
  controllers: [AdminSettingsController],
  providers: [AdminSettingsService],
})
export class AdminSettingsModule {}
