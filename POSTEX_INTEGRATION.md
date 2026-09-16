# PostEx Courier API Integration Guide

This document details the architecture, configuration, batch scheduling, status lifecycle, and admin queue workflows for the PostEx Courier API integration in `nanos.pk`.

---

## 1. Pickup Address & Warehouse Configuration

- **API Endpoint**: `GET https://api.postex.pk/services/integration/api/order/v1/get-merchant-address`
- **Default Warehouse Selected**:
  - `addressCode`: `"001"`
  - `addressType`: `"Default Address"`
  - `cityName`: `"Lahore"`
  - `address`: `"Grand mobiles shop, shop 3, jan muhammad road Alhamra town, Lahore"`
  - `contactPersonName`: `"Nanospk"`
  - `phone1`: `"03051000812"`

---

## 2. Auto-Book City List & Routing Logic

When a customer places an order, its delivery city (from `shippingInfo.city`) is checked against the auto-book city list.

- **Default Auto-Book Cities**: `Lahore`, `Karachi`, `Gujrat`
- **Routing Rules**:
  - **Auto-Book Match** (`pending_auto`): Orders from auto-book cities are automatically queued for the daily PostEx batch booking job.
  - **Other Cities** (`pending_manual_review`): Orders from non-auto-book cities are put in manual review state and require admin approval before being included in the batch.
- **Where to Edit Auto-Book Cities**:
  1. **Admin UI**: Navigate to `/courier` in the Admin Panel to dynamically add, enable, or disable auto-book cities in real time.
  2. **Codebase**: Defined in `PostexService.isAutoBookCity()` inside [`apps/api/src/postex/postex.service.ts`](file:///c:/Users/GWB/Desktop/Nanos/nanos-pk/apps/api/src/postex/postex.service.ts).

---

## 3. Batch Schedule & Cron Jobs

PostEx order creation API calls are **never** executed in real-time during customer checkout to prevent blocking order creation. All bookings are processed in a scheduled batch job.

- **Daily Batch Booking Job**:
  - **Cron Expression**: `0 16 * * *` (Runs once daily at 4:00 PM local time).
  - **Location**: [`apps/api/src/postex/postex-scheduler.service.ts`](file:///c:/Users/GWB/Desktop/Nanos/nanos-pk/apps/api/src/postex/postex-scheduler.service.ts).
  - **How to Change Cutoff Time**: Update `@Cron(CronExpression.EVERY_DAY_AT_4PM)` or specify a custom cron expression (e.g. `'0 17 * * *'` for 5:00 PM).
- **Status Tracking Job**:
  - **Cron Expression**: `0 */4 * * *` (Runs every 4 hours).
  - Checks PostEx tracking API for all booked orders and updates delivery/return statuses automatically.

---

## 4. `courierBookingStatus` Lifecycle Enum

| Status Value | Meaning & Flow |
| :--- | :--- |
| `pending_auto` | Order created from an auto-book city, queued for the next daily batch. |
| `pending_manual_review` | Order created from a manual-review city, awaiting admin approval. |
| `queued_for_batch` | Order approved by admin, queued for the next daily batch. |
| `booked` | Successfully booked with PostEx; `postexTrackingNumber` assigned. |
| `booking_failed` | PostEx API returned an error or network failed. Logged in `PostexBookingLog`. |
| `delivered` | PostEx status tracking confirmed order delivery to customer. |
| `returned` | PostEx status tracking confirmed order returned/cancelled. |

---

## 5. Admin Courier Queue Page (`/courier`)

The Admin Courier page provides 4 main operational sections:
1. **Awaiting Manual Approval**: Orders from non-auto-book cities. Clicking **Approve** sets `adminApproved=true` and queues the order for the batch.
2. **Failed Bookings**: Displays all booking failures with exact PostEx error messages from `PostexBookingLog`. Clicking **Retry Booking** re-attempts the API call immediately outside the batch schedule.
3. **Queued for Next Batch**: Displays all orders pending auto-booking or approved manual orders. Includes a **Run Batch Booking Now** button for manual batch execution/testing.
4. **Auto-Book Cities Configuration**: Real-time management of auto-book cities.
