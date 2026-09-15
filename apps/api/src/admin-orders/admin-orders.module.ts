import { Module } from '@nestjs/common';
import { AdminOrdersController } from './admin-orders.controller.js';
import { AdminOrdersService } from './admin-orders.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AdminAuthModule } from '../admin-auth/admin-auth.module.js';

@Module({
  imports: [PrismaModule, AdminAuthModule],
  controllers: [AdminOrdersController],
  providers: [AdminOrdersService],
})
export class AdminOrdersModule {}
