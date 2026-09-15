import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminProductsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.product.findMany({
      include: { variants: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });
    if (!product) throw new NotFoundException(`Product "${id}" not found`);
    return product;
  }

  create(data: {
    name: string; category: string; tag?: string | null; price: number;
    oldPrice?: number | null; desc: string; hero: string;
    colorsJson: string; sizesJson: string; galleryJson: string; isSale?: boolean;
  }) {
    return this.prisma.product.create({ data: { ...data, outOfStockJson: '[]' } });
  }

  async update(id: string, data: Partial<{
    name: string; category: string; tag: string | null; price: number;
    oldPrice: number | null; desc: string; hero: string;
    colorsJson: string; sizesJson: string; galleryJson: string; isSale: boolean;
  }>) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }

  async updateVariantStock(productId: string, color: string, size: string, stock: number) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { productId_color_size: { productId, color, size } },
    });
    if (!variant) throw new NotFoundException(`Variant ${color}/${size} not found for product "${productId}"`);
    return this.prisma.productVariant.update({
      where: { productId_color_size: { productId, color, size } },
      data: { stock },
    });
  }

  async addVariant(productId: string, color: string, size: string, stock: number) {
    await this.findOne(productId);
    return this.prisma.productVariant.upsert({
      where: { productId_color_size: { productId, color, size } },
      update: { stock },
      create: { productId, color, size, stock },
    });
  }

  getSizeChart(category: string) {
    return this.prisma.sizeChart.findUnique({ where: { category } });
  }

  upsertSizeChart(category: string, rowsJson: string) {
    return this.prisma.sizeChart.upsert({
      where: { category },
      update: { rowsJson },
      create: { category, rowsJson },
    });
  }
}
