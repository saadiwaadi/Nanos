import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

export type ProductFilters = {
  category?: string;
  sale?: boolean;
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters: ProductFilters = {}) {
    return this.prisma.product.findMany({
      where: {
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.sale ? { isSale: true } : {}),
      },
      include: { colors: { orderBy: { sortOrder: "asc" as const } } },
      orderBy: { createdAt: "asc" },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { colors: { orderBy: { sortOrder: "asc" as const } } },
    });
    if (!product) {
      throw new NotFoundException(`Product "${id}" not found`);
    }
    return product;
  }
}
