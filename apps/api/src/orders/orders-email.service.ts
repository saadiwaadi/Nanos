import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";

export type OrderEmailData = {
  id: string;
  userId: string | null;
  guestEmail: string | null;
  guestName: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shippingInfo: any;
  payment: string;
  status: string;
  createdAt: Date | string;
  items: {
    productId: string;
    color: string;
    size: string;
    qty: number;
    unitPrice: number;
  }[];
};

@Injectable()
export class OrdersEmailService {
  private readonly logger = new Logger(OrdersEmailService.name);

  async sendOrderConfirmation(
    order: OrderEmailData,
    recipientEmail: string,
    recipientName?: string | null,
  ) {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "Nanos <orders@nanos.pk>";
    const isProd = process.env.NODE_ENV === "production";
    if (isProd && !process.env.ORDER_CONFIRMATION_BASE_URL) {
      this.logger.error("ORDER_CONFIRMATION_BASE_URL must be defined in production environment");
    }
    const baseUrl =
      process.env.ORDER_CONFIRMATION_BASE_URL ||
      (!isProd ? "http://localhost:3000" : "");

    const name = recipientName || "Valued Customer";
    const isGuest = !order.userId;
    const confirmationUrl = isGuest
      ? `${baseUrl}/confirmation/${order.id}?email=${encodeURIComponent(recipientEmail)}`
      : `${baseUrl}/confirmation/${order.id}`;

    const itemsHtml = order.items
      .map(
        (i) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">
            <strong>${i.productId}</strong><br/>
            <span style="font-size: 12px; color: #666;">${i.color} · Size ${i.size}</span>
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">${i.qty}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">PKR ${i.unitPrice.toLocaleString()}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">PKR ${(i.unitPrice * i.qty).toLocaleString()}</td>
        </tr>`,
      )
      .join("");

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.5;">
        <h2 style="color: #111;">Order Confirmation — #${order.id}</h2>
        <p>Hi ${name},</p>
        <p>Thank you for your order with Nanos! We have received your order and are processing it.</p>
        
        <div style="background-color: #f9f9f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h3 style="margin-top: 0; font-size: 16px;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #eee; text-align: left;">
                <th style="padding: 8px 12px;">Item</th>
                <th style="padding: 8px 12px; text-align: center;">Qty</th>
                <th style="padding: 8px 12px; text-align: right;">Price</th>
                <th style="padding: 8px 12px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 16px; text-align: right; font-size: 14px; line-height: 1.8;">
            <div>Subtotal: PKR ${order.subtotal.toLocaleString()}</div>
            ${order.discount > 0 ? `<div style="color: #27ae60;">Promo Discount: −PKR ${order.discount.toLocaleString()}</div>` : ""}
            <div>Shipping: ${order.shipping === 0 ? "Free" : `PKR ${order.shipping.toLocaleString()}`}</div>
            <div style="font-size: 16px; font-weight: bold; margin-top: 8px;">Total: PKR ${order.total.toLocaleString()}</div>
          </div>
        </div>

        <div style="background-color: #fdf8e6; border: 1px solid #f0e6c2; padding: 14px; border-radius: 6px; font-size: 14px; margin-bottom: 20px;">
          <strong>Payment Notice:</strong> Cash on Delivery (COD). Pay on delivery — no payment required now.
        </div>

        <p style="text-align: center; margin-top: 24px;">
          <a href="${confirmationUrl}" style="background-color: #111; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 4px; display: inline-block; font-weight: bold;">
            View Order Confirmation
          </a>
        </p>
      </div>
    `;

    const payload = {
      from: fromEmail,
      to: recipientEmail,
      subject: `Order Confirmation #${order.id} — Nanos`,
      html: htmlBody,
    };

    this.logger.log(`[Resend Email Payload] Target: ${recipientEmail} | Order: ${order.id}`);

    try {
      if (!apiKey || apiKey === "re_set_me_placeholder") {
        this.logger.warn(`[Resend Email Skipped] Missing or placeholder RESEND_API_KEY. Payload generated: ${JSON.stringify({ to: payload.to, subject: payload.subject, orderId: order.id })}`);
        return { success: false, reason: "Placeholder or missing API key" };
      }

      const resend = new Resend(apiKey);
      const res = await resend.emails.send(payload);

      if (res.error) {
        this.logger.error(`[Resend Email API Error] ${JSON.stringify(res.error)}`);
        return { success: false, error: res.error };
      }

      this.logger.log(`[Resend Email Sent Success] ID: ${res.data?.id}`);
      return { success: true, data: res.data };
    } catch (err: any) {
      // NEVER block or throw on email error — log server-side only
      this.logger.error(`[Resend Email Dispatch Exception] ${err?.message || err}`);
      return { success: false, error: String(err) };
    }
  }
}
