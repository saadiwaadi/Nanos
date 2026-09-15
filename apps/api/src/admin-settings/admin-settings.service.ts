import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminSettingsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.categorySettings.findMany({ orderBy: { category: 'asc' } });
  }

  async updateThreshold(category: string, lowStockThreshold: number) {
    const row = await this.prisma.categorySettings.findUnique({ where: { category } });
    if (!row) throw new NotFoundException(`Category "${category}" has no settings row`);
    return this.prisma.categorySettings.update({
      where: { category },
      data: { lowStockThreshold },
    });
  }
}
