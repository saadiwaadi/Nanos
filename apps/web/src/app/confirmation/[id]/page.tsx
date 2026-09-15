"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getToken } from "@/lib/auth";
import { API_BASE } from "@/lib/api";
import { fmtPrice } from "@/lib/cart";

type OrderItem = {
  id: string;
  productId: string;
  color: string;
  size: string;
  qty: number;
  unitPrice: number;
};

type OrderData = {
  id: string;
  userId: string | null;
  guestEmail: string | null;
  guestName: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shippingInfo: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    postal?: string;
  };
  payment: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
};

type ProductNames = Record<string, string>;

export default function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const searchParams = useSearchParams();
  const guestEmail = searchParams.get("email");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [productNames, setProductNames] = useState<ProductNames>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        let res: Response | null = null;

        if (token) {
          res = await fetch(`${API_BASE}/orders/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }

        if ((!res || !res.ok) && guestEmail) {
          res = await fetch(
            `${API_BASE}/orders/${orderId}/guest?email=${encodeURIComponent(
              guestEmail,
            )}`,
          );
        }

        if (!res || !res.ok) {
          throw new Error("Order not found or access denied.");
        }

        const data: OrderData = await res.json();
        setOrder(data);

        const namesMap: ProductNames = {};
        for (const item of data.items) {
          if (!namesMap[item.productId]) {
            try {
              const pRes = await fetch(
                `${API_BASE}/products/${item.productId}`,
              );
              if (pRes.ok) {
                const pData = await pRes.json();
                namesMap[item.productId] = pData.name;
              }
            } catch {
              namesMap[item.productId] = item.productId;
            }
          }
        }
        setProductNames(namesMap);
      } catch (err: any) {
        setError(err.message || "Failed to load order.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId, guestEmail]);

  if (loading) {
    return (
      <div className="page">
        <div className="wrap">
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: 16, color: "#666" }}>
              Loading your order confirmation...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page">
        <div className="wrap">
          <div className="empty-state">
            <h2>Order Not Found</h2>
            <p>{error || "We couldn't find details for this order."}</p>
            <Link
              href="/"
              className="btn btn-primary"
              style={{ marginTop: 16 }}
            >
              Return to Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const dateStr = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="page">
      <div className="wrap" style={{ maxWidth: 800 }}>
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">/</span>
          <span className="current">Order Confirmation</span>
        </div>

        <div style={{ textAlign: "center", margin: "24px 0 36px" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              backgroundColor: "#eef9ed",
              color: "#27ae60",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            Thank you for your order!
          </h1>
          <p style={{ color: "#555", fontSize: 15 }}>
            Your order <strong>#{order.id}</strong> has been placed
            successfully on {dateStr}.
          </p>
        </div>

        <div className="checkout-layout" style={{ gridTemplateColumns: "1fr" }}>
          <div className="form-section">
            <h3 style={{ marginBottom: 16 }}>Items Ordered</h3>
            <div style={{ borderTop: "1px solid #eee" }}>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>
                      {productNames[item.productId] || item.productId} ×{" "}
                      {item.qty}
                    </div>
                    <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                      {item.color} · Size {item.size}
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    {fmtPrice(item.unitPrice * item.qty)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 28 }}>
              <h3 style={{ marginBottom: 16 }}>Shipping Details</h3>
              <div
                style={{
                  background: "#fafafa",
                  padding: 16,
                  borderRadius: 8,
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                <div>
                  <strong>Name:</strong>{" "}
                  {order.shippingInfo.name || order.guestName || "N/A"}
                </div>
                <div>
                  <strong>Email:</strong>{" "}
                  {order.shippingInfo.email || order.guestEmail || "N/A"}
                </div>
                <div>
                  <strong>Phone:</strong> {order.shippingInfo.phone || "N/A"}
                </div>
                <div>
                  <strong>Address:</strong> {order.shippingInfo.address},{" "}
                  {order.shippingInfo.city} {order.shippingInfo.postal}
                </div>
                <div>
                  <strong>Payment Method:</strong> Cash on Delivery (COD)
                </div>
              </div>
            </div>

            <div className="summary-box" style={{ marginTop: 28 }}>
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{fmtPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="summary-row">
                  <span>Promo Discount</span>
                  <span>−{fmtPrice(order.discount)}</span>
                </div>
              )}
              <div className="summary-row">
                <span>Shipping</span>
                <span>
                  {order.shipping === 0 ? "Free" : fmtPrice(order.shipping)}
                </span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>{fmtPrice(order.total)}</span>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: 28 }}>
              <Link href="/" className="btn btn-primary btn-block">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
