import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PostexService } from "./postex.service.js";

@Injectable()
export class PostexSchedulerService {
  private readonly logger = new Logger(PostexSchedulerService.name);

  constructor(private readonly postexService: PostexService) {}

  /**
   * Daily PostEx Batch Booking Cron Job
   * Schedule: Run once daily at 4:00 PM (16:00) local time.
   * To change the cutoff time, edit the cron expression below (e.g. '0 17 * * *' for 5 PM).
   */
  @Cron(CronExpression.EVERY_DAY_AT_4PM)
  async handleDailyBatchBooking() {
    this.logger.log("Cron trigger: Starting daily PostEx batch booking...");
    try {
      const results = await this.postexService.processBatchBooking();
      this.logger.log(
        `Cron finished: Processed ${results.length} orders in batch booking.`,
      );
    } catch (err: any) {
      this.logger.error(`Cron error in PostEx batch booking: ${err.message}`);
    }
  }

  /**
   * Status Tracking Cron Job
   * Schedule: Run every 4 hours.
   */
  @Cron(CronExpression.EVERY_4_HOURS)
  async handleStatusTracking() {
    this.logger.log("Cron trigger: Starting 4-hour PostEx tracking update...");
    try {
      const results = await this.postexService.processBatchTracking();
      this.logger.log(
        `Cron finished: Tracked ${results.length} booked PostEx orders.`,
      );
    } catch (err: any) {
      this.logger.error(`Cron error in PostEx status tracking: ${err.message}`);
    }
  }
}
