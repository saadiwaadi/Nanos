import {
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  NotFoundException,
} from "@nestjs/common";
import { PostexService } from "./postex.service.js";
import { AdminJwtGuard } from "../admin-auth/admin-jwt.guard.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Controller("admin/courier-queue")
@UseGuards(AdminJwtGuard)
export class PostexController {
  constructor(
    private readonly postexService: PostexService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getQueue() {
    return this.postexService.getAdminCourierQueue();
  }

  @Patch(":orderId/approve")
  async approveOrder(@Param("orderId") orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }
    return this.postexService.approveManualOrder(orderId);
  }

  @Post(":orderId/retry")
  async retryOrder(
    @Param("orderId") orderId: string,
    @Body() customPayload?: any,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }
    return this.postexService.retryOrderBooking(orderId, customPayload);
  }

  @Post("run-batch-now")
  async runBatchNow() {
    return this.postexService.processBatchBooking();
  }

  @Post("run-tracking-now")
  async runTrackingNow() {
    return this.postexService.processBatchTracking();
  }

  @Get("cities")
  async getCities() {
    const dbCities = await this.prisma.postexAutoBookCity.findMany({
      orderBy: { cityName: "asc" },
    });
    return {
      defaultCities: ["Lahore", "Karachi", "Gujrat"],
      dbCities,
    };
  }

  @Put("cities")
  async updateCities(@Body() body: { cityName: string; enabled: boolean }) {
    const { cityName, enabled } = body;
    if (!cityName) {
      throw new Error("cityName is required");
    }
    const normalized = cityName.trim();
    return this.prisma.postexAutoBookCity.upsert({
      where: { cityName: normalized },
      update: { enabled },
      create: { cityName: normalized, enabled },
    });
  }
}
