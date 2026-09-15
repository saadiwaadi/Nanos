import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProductsModule } from './products/products.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AdminAuthModule } from './admin-auth/admin-auth.module.js';
import { AdminProductsModule } from './admin-products/admin-products.module.js';
import { AdminSettingsModule } from './admin-settings/admin-settings.module.js';

@Module({
  imports: [PrismaModule, ProductsModule, AuthModule, AdminAuthModule, AdminProductsModule, AdminSettingsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
