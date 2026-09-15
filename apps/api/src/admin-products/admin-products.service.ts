import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
      include: { variants: true, colors: { orderBy: { sortOrder: 'asc' } } },
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

  async addColor(productId: string, data: { name: string; hex: string; imagesJson?: string }) {
    await this.findOne(productId);
    const count = await this.prisma.productColor.count({ where: { productId } });
    return this.prisma.productColor.create({
      data: {
        productId,
        name: data.name,
        hex: data.hex,
        imagesJson: data.imagesJson ?? '[]',
        sortOrder: count,
      },
    });
  }

  async updateColor(
    productId: string,
    colorId: string,
    data: Partial<{ name: string; hex: string; imagesJson: string; sortOrder: number }>,
  ) {
    const color = await this.prisma.productColor.findFirst({
      where: { id: colorId, productId },
    });
    if (!color) throw new NotFoundException(`Color "${colorId}" not found for product "${productId}"`);
    return this.prisma.productColor.update({ where: { id: colorId }, data });
  }

  async removeColor(productId: string, colorId: string) {
    const color = await this.prisma.productColor.findFirst({
      where: { id: colorId, productId },
    });
    if (!color) throw new NotFoundException(`Color "${colorId}" not found for product "${productId}"`);
    const count = await this.prisma.productColor.count({ where: { productId } });
    if (count <= 1) {
      throw new BadRequestException('Cannot delete the last color of a product');
    }
    return this.prisma.productColor.delete({ where: { id: colorId } });
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
