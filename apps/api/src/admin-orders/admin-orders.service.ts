import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const VALID_STATUSES = ['processing', 'shipped', 'delivered', 'cancelled'];

@Injectable()
export class AdminOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [total, orders] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, name: true } },
          items: {
            select: {
              id: true,
              qty: true,
              unitPrice: true,
            },
          },
        },
      }),
    ]);

    const formatted = orders.map((o) => {
      const customerEmail = o.userId ? o.user?.email : o.guestEmail;
      const customerName = o.userId ? o.user?.name : o.guestName;
      const itemCount = o.items.reduce((sum, item) => sum + item.qty, 0);

      return {
        id: o.id,
        createdAt: o.createdAt,
        userId: o.userId,
        customerEmail: customerEmail ?? null,
        customerName: customerName ?? null,
        isGuest: !o.userId,
        itemCount,
        subtotal: o.subtotal,
        discount: o.discount,
        shipping: o.shipping,
        total: o.total,
        payment: o.payment,
        status: o.status,
      };
    });

    return {
      data: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, hero: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    const customerEmail = order.userId ? order.user?.email : order.guestEmail;
    const customerName = order.userId ? order.user?.name : order.guestName;

    return {
      ...order,
      customerEmail: customerEmail ?? null,
      customerName: customerName ?? null,
      isGuest: !order.userId,
    };
  }

  async updateStatus(id: string, status: string) {
    const normalizedStatus = status.trim().toLowerCase();
    if (!VALID_STATUSES.includes(normalizedStatus)) {
      throw new BadRequestException(
        `Invalid status '${status}'. Must be one of: ${VALID_STATUSES.join(', ')}`,
      );
    }

    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: normalizedStatus },
    });
  }
}
