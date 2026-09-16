import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service.js";
import { extractBearer, JwtPayload } from "../auth/jwt.strategy.js";
import { CreateOrderDto } from "./dto/order.dto.js";
import { OrdersEmailService } from "./orders-email.service.js";
import { PostexService } from "../postex/postex.service.js";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly ordersEmailService: OrdersEmailService,
    private readonly postexService: PostexService,
  ) {}

  async createOrder(dto: CreateOrderDto, authHeader?: string) {
    let userId: string | null = null;
    let userEmail: string | null = null;
    let userName: string | null = null;

    if (authHeader) {
      const token = extractBearer({ headers: { authorization: authHeader } });
      if (token) {
        try {
          const payload = this.jwtService.verify<JwtPayload>(token, {
            secret: process.env.JWT_SECRET ?? "",
          });
          if (payload?.sub) {
            const user = await this.prisma.user.findUnique({
              where: { id: payload.sub },
              select: { id: true, email: true, name: true },
            });
            if (user) {
              userId = user.id;
              userEmail = user.email;
              userName = user.name;
            }
          }
        } catch {
          // Token is invalid/expired — fallback to guest validation below
        }
      }
    }

    const guestEmail = dto.guestEmail?.trim();
    const guestName = dto.guestName?.trim();

    if (!userId) {
      if (!guestEmail || !guestName) {
        throw new BadRequestException(
          "guestEmail and guestName are required for guest checkout",
        );
      }
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException("Order must contain at least one item");
    }

    const shippingInfo = dto.shippingInfo ?? {};
    const phone = typeof shippingInfo.phone === "string" ? shippingInfo.phone.trim() : "";
    const address = typeof shippingInfo.address === "string" ? shippingInfo.address.trim() : "";
    const digitsCount = (phone.match(/\d/g) || []).length;

    if (!phone || digitsCount < 10) {
      throw new BadRequestException(
        "Shipping phone number is required and must contain at least 10 digits",
      );
    }

    if (!address || address.length < 5) {
      throw new BadRequestException(
        "Shipping address is required and must be at least 5 characters long",
      );
    }

    const preparedItems: {
      productId: string;
      color: string;
      size: string;
      qty: number;
      unitPrice: number;
    }[] = [];

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) {
        throw new BadRequestException(
          `Product with ID "${item.productId}" not found`,
        );
      }

      const variant = await this.prisma.productVariant.findUnique({
        where: {
          productId_color_size: {
            productId: item.productId,
            color: item.color,
            size: item.size,
          },
        },
      });
      if (!variant) {
        throw new BadRequestException(
          `Variant with color "${item.color}" and size "${item.size}" does not exist for product "${product.name}"`,
        );
      }

      preparedItems.push({
        productId: item.productId,
        color: item.color,
        size: item.size,
        qty: item.qty,
        unitPrice: product.price,
      });
    }

    const subtotal = preparedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.qty,
      0,
    );
    const promoValid =
      dto.promoCode?.trim().toUpperCase() === "NANOS10" &&
      preparedItems.length > 0;
    const discount = promoValid ? Math.round(subtotal * 0.1) : 0;
    const shipping = 0;
    const total = subtotal - discount + shipping;

    const city = typeof shippingInfo.city === "string" ? shippingInfo.city.trim() : "";
    const isAutoBook = await this.postexService.isAutoBookCity(city);
    const courierBookingStatus = isAutoBook ? "pending_auto" : "pending_manual_review";

    const order = await this.prisma.order.create({
      data: {
        userId: userId ?? null,
        guestEmail: userId ? null : guestEmail,
        guestName: userId ? null : guestName,
        subtotal,
        discount,
        shipping,
        total,
        shippingInfo: dto.shippingInfo ?? {},
        payment: "cod",
        status: "processing",
        courierBookingStatus: courierBookingStatus as any,
        pickupAddressCode: "001",
        items: {
          create: preparedItems.map((item) => ({
            productId: item.productId,
            color: item.color,
            size: item.size,
            qty: item.qty,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    const recipientEmail = userId ? userEmail : guestEmail;
    const recipientName = userId ? userName : guestName;
    if (recipientEmail) {
      this.ordersEmailService
        .sendOrderConfirmation(order, recipientEmail, recipientName)
        .catch(() => {});

      this.sendMetaPurchaseEvent(order, recipientEmail).catch(() => {});
    }

    return order;
  }

  private async sendMetaPurchaseEvent(
    order: { id: string; total: number },
    email: string,
  ) {
    const pixelId =
      process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID;
    const token = process.env.META_CONVERSIONS_API_TOKEN;

    if (!pixelId || !token) {
      return;
    }

    const hashedEmail = crypto
      .createHash("sha256")
      .update(email.trim().toLowerCase())
      .digest("hex");

    const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`;
    const payload = {
      data: [
        {
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          event_id: order.id,
          action_source: "website",
          user_data: {
            em: [hashedEmail],
          },
          custom_data: {
            currency: "PKR",
            value: order.total,
          },
        },
      ],
    };

    try {
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch {
      // Non-blocking catch per requirements
    }
  }

  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
  }

  async getUserOrderById(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.userId !== userId) {
      throw new NotFoundException(`Order with ID "${orderId}" not found`);
    }
    return order;
  }

  async getGuestOrderById(orderId: string, email?: string) {
    if (!email) {
      throw new NotFoundException(`Order with ID "${orderId}" not found`);
    }
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (
      !order ||
      !order.guestEmail ||
      order.guestEmail.toLowerCase() !== email.trim().toLowerCase()
    ) {
      throw new NotFoundException(`Order with ID "${orderId}" not found`);
    }
    return order;
  }
}
