import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

export interface PostexCreateOrderPayload {
  cityName: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  invoiceDivision: number;
  invoicePayment: number;
  orderDetail: string;
  orderRefNumber: string;
  pickupAddressCode: string;
  orderType: string;
}

export interface PostexCreateOrderResponse {
  statusCode: string;
  statusMessage: string;
  dist?: {
    trackingNumber: string;
    orderStatus: string;
    orderDate: string;
  };
  error?: string;
  message?: string;
}

export interface PostexTrackOrderResponse {
  statusCode: string;
  statusMessage: string;
  dist?: {
    trackingNumber: string;
    transactionStatus: string;
    cityName: string;
    deliveryAddress: string;
    customerName: string;
    customerPhone: string;
    invoicePayment: number;
    orderRefNumber: string;
    transactionStatusHistory?: {
      transactionStatusMessage: string;
      transactionStatusMessageCode: string;
      updatedAt: string;
    }[];
  };
}

@Injectable()
export class PostexService {
  private readonly logger = new Logger(PostexService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get baseUrl(): string {
    return (
      process.env.POSTEX_BASE_URL ||
      "https://api.postex.pk"
    ).replace(/\/$/, "");
  }

  private get token(): string {
    return process.env.POSTEX_API_TOKEN || "";
  }

  /**
   * One-time / reference call: Get registered merchant pickup addresses
   */
  async getPickupAddresses() {
    const url = `${this.baseUrl}/services/integration/api/order/v1/get-merchant-address`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        token: this.token,
        "Content-Type": "application/json",
      },
    });
    return res.json();
  }

  /**
   * PostEx Order Creation API call
   */
  async callCreateOrderApi(payload: PostexCreateOrderPayload): Promise<PostexCreateOrderResponse> {
    const url = `${this.baseUrl}/services/integration/api/order/v1/create-order`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        token: this.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data as PostexCreateOrderResponse;
  }

  /**
   * PostEx Track Order API call (single)
   */
  async callTrackOrderApi(trackingNumber: string): Promise<PostexTrackOrderResponse> {
    const url = `${this.baseUrl}/services/integration/api/order/v1/track-order/${encodeURIComponent(trackingNumber)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        token: this.token,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    return data as PostexTrackOrderResponse;
  }

  /**
   * PostEx Cancel Order API call
   */
  async callCancelOrderApi(trackingNumber: string) {
    const url = `${this.baseUrl}/services/integration/api/order/v1/cancel-order`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        token: this.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ trackingNumber }),
    });
    return res.json();
  }

  /**
   * Helper: check if a city is in the auto-book list
   */
  async isAutoBookCity(city: string): Promise<boolean> {
    if (!city) return false;
    const normalized = city.trim().toLowerCase();

    // Check DB table first
    const citiesInDb = await this.prisma.postexAutoBookCity.findMany({
      where: { enabled: true },
    });

    if (citiesInDb.length > 0) {
      return citiesInDb.some(
        (c) => c.cityName.trim().toLowerCase() === normalized,
      );
    }

    // Default fallback auto-book cities: Lahore, Karachi, Gujrat
    const defaultAutoBookCities = ["lahore", "karachi", "gujrat"];
    return defaultAutoBookCities.includes(normalized);
  }

  /**
   * Execute batch booking for all eligible pending orders
   */
  async processBatchBooking() {
    this.logger.log("Starting PostEx Batch Booking Process...");

    // Find orders with pending_auto OR (pending_manual_review AND adminApproved=true) OR queued_for_batch
    const eligibleOrders = await this.prisma.order.findMany({
      where: {
        OR: [
          { courierBookingStatus: "pending_auto" },
          { courierBookingStatus: "queued_for_batch" },
          {
            courierBookingStatus: "pending_manual_review",
            adminApproved: true,
          },
        ],
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    this.logger.log(`Found ${eligibleOrders.length} orders eligible for PostEx booking.`);
    const results = [];

    for (const order of eligibleOrders) {
      const result = await this.bookSingleOrder(order);
      results.push(result);
    }

    return results;
  }

  /**
   * Attempt booking for a single order and log result safely
   */
  async bookSingleOrder(order: any, customPayloadOverride?: Partial<PostexCreateOrderPayload>) {
    const shippingInfo = (order.shippingInfo as any) || {};
    const customerName =
      shippingInfo.name || order.guestName || "Valued Customer";
    const customerPhone = shippingInfo.phone || "";
    const deliveryAddress = `${shippingInfo.address || ""}, ${shippingInfo.city || ""}`.trim();
    const cityName = shippingInfo.city || "Lahore";

    // Item breakdown string
    const itemDetails = Array.isArray(order.items) && order.items.length > 0
      ? order.items
          .map((i: any) => `${i.product?.name || "Item"} (${i.color}/${i.size}) x${i.qty}`)
          .join(", ")
      : "nanos.pk order";

    const payload: PostexCreateOrderPayload = {
      cityName,
      customerName,
      customerPhone,
      deliveryAddress,
      invoiceDivision: 1,
      invoicePayment: order.total,
      orderDetail: itemDetails,
      orderRefNumber: order.id,
      pickupAddressCode: order.pickupAddressCode || "001",
      orderType: "Normal",
      ...customPayloadOverride,
    };

    let responseData: PostexCreateOrderResponse | null = null;
    let success = false;
    let errorMessage: string | null = null;

    try {
      responseData = await this.callCreateOrderApi(payload);

      if (
        responseData &&
        (responseData.statusCode === "200" || responseData.statusCode === "201") &&
        responseData.dist?.trackingNumber
      ) {
        success = true;
        const trackingNumber = responseData.dist.trackingNumber;
        const postexStatus = responseData.dist.orderStatus || "UnBooked";

        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            postexTrackingNumber: trackingNumber,
            postexStatus: postexStatus,
            courierBookingStatus: "booked",
          },
        });
      } else {
        success = false;
        errorMessage =
          responseData?.statusMessage ||
          responseData?.message ||
          responseData?.error ||
          "PostEx API returned non-200 status code";

        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            courierBookingStatus: "booking_failed",
          },
        });
      }
    } catch (err: any) {
      success = false;
      errorMessage = err.message || "Network/Unexpected error connecting to PostEx API";

      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          courierBookingStatus: "booking_failed",
        },
      });
    }

    // Record in PostexBookingLog
    const log = await this.prisma.postexBookingLog.create({
      data: {
        orderId: order.id,
        requestPayload: payload as any,
        responsePayload: (responseData || {}) as any,
        success,
        errorMessage,
      },
    });

    return { orderId: order.id, success, errorMessage, log, response: responseData, request: payload };
  }

  /**
   * Execute batch tracking for all currently booked orders
   */
  async processBatchTracking() {
    this.logger.log("Starting PostEx Batch Tracking Process...");

    const bookedOrders = await this.prisma.order.findMany({
      where: {
        courierBookingStatus: "booked",
        postexTrackingNumber: { not: null },
      },
    });

    this.logger.log(`Found ${bookedOrders.length} booked orders to track.`);
    const results = [];

    for (const order of bookedOrders) {
      if (!order.postexTrackingNumber) continue;
      try {
        const trackData = await this.callTrackOrderApi(order.postexTrackingNumber);
        if (trackData && trackData.statusCode === "200" && trackData.dist) {
          const rawStatus = trackData.dist.transactionStatus || "";
          let newCourierStatus = order.courierBookingStatus;

          const statusLower = rawStatus.toLowerCase();
          if (statusLower.includes("delivered")) {
            newCourierStatus = "delivered";
          } else if (statusLower.includes("return") || statusLower.includes("cancel")) {
            newCourierStatus = "returned";
          }

          await this.prisma.order.update({
            where: { id: order.id },
            data: {
              postexStatus: rawStatus,
              courierBookingStatus: newCourierStatus,
            },
          });

          await this.prisma.postexBookingLog.create({
            data: {
              orderId: order.id,
              requestPayload: { action: "trackOrder", trackingNumber: order.postexTrackingNumber },
              responsePayload: trackData as any,
              success: true,
            },
          });

          results.push({ orderId: order.id, status: rawStatus, courierStatus: newCourierStatus });
        }
      } catch (err: any) {
        this.logger.error(`Error tracking order ${order.id}: ${err.message}`);
      }
    }

    return results;
  }

  /**
   * Immediately retry booking for a single order outside schedule
   */
  async retryOrderBooking(orderId: string, customPayload?: Partial<PostexCreateOrderPayload>) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    return this.bookSingleOrder(order, customPayload);
  }

  /**
   * Fetch Courier Queue overview for Admin
   */
  async getAdminCourierQueue() {
    const [awaitingApproval, queuedForBatch, failedBookings, bookedOrders] = await Promise.all([
      this.prisma.order.findMany({
        where: { courierBookingStatus: "pending_manual_review", adminApproved: false },
        orderBy: { createdAt: "desc" },
        include: { bookingLogs: { orderBy: { attemptedAt: "desc" }, take: 1 } },
      }),
      this.prisma.order.findMany({
        where: {
          OR: [
            { courierBookingStatus: "pending_auto" },
            { courierBookingStatus: "queued_for_batch" },
            { courierBookingStatus: "pending_manual_review", adminApproved: true },
          ],
        },
        orderBy: { createdAt: "desc" },
        include: { bookingLogs: { orderBy: { attemptedAt: "desc" }, take: 1 } },
      }),
      this.prisma.order.findMany({
        where: { courierBookingStatus: "booking_failed" },
        orderBy: { createdAt: "desc" },
        include: { bookingLogs: { orderBy: { attemptedAt: "desc" }, take: 1 } },
      }),
      this.prisma.order.findMany({
        where: { courierBookingStatus: "booked" },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { bookingLogs: { orderBy: { attemptedAt: "desc" }, take: 1 } },
      }),
    ]);

    return {
      awaitingApproval,
      queuedForBatch,
      failedBookings,
      bookedOrders,
    };
  }

  /**
   * Admin approves a manual-review order
   */
  async approveManualOrder(orderId: string) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        adminApproved: true,
        courierBookingStatus: "queued_for_batch",
      },
    });
  }
}
