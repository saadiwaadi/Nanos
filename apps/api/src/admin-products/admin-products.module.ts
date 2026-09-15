import { Module } from '@nestjs/common';
import { AdminProductsController } from './admin-products.controller.js';
import { AdminProductsService } from './admin-products.service.js';
import { AdminAuthModule } from '../admin-auth/admin-auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [AdminAuthModule, PrismaModule],
  controllers: [AdminProductsController],
  providers: [AdminProductsService],
})
export class AdminProductsModule {}
