'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { API_BASE } from '@/lib/api';

type OrderItem = {
  id: string;
  productId: string;
  color: string;
  size: string;
  qty: number;
  unitPrice: number;
  product?: {
    id: string;
    name: string;
    hero: string;
  };
};

type OrderDetail = {
  id: string;
  createdAt: string;
  userId: string | null;
  guestEmail: string | null;
  guestName: string | null;
  customerEmail: string | null;
  customerName: string | null;
  isGuest: boolean;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shippingInfo: any;
  payment: string;
  status: string;
  items: OrderItem[];
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/admin/orders/${id}`, { credentials: 'include' });
        if (res.status === 401) {
          window.location.href = '/';
          return;
        }
        if (res.status === 404) {
          setError(`Order #${id} not found.`);
          return;
        }
        if (res.status !== 200) {
          setError(`Failed to load order detail (status ${res.status})`);
          return;
        }
        const data: OrderDetail = await res.json();
        setOrder(data);
      } catch {
        setError('Network error loading order detail');
      }
    }
    load();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;
    setUpdatingStatus(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${id}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.status === 200) {
        const updated = await res.json();
        setOrder((prev) => (prev ? { ...prev, status: updated.status } : prev));
        setStatusMsg({ ok: true, text: 'Status updated' });
        setTimeout(() => setStatusMsg(null), 3000);
      } else {
        setStatusMsg({ ok: false, text: `Update failed (status ${res.status})` });
      }
    } catch {
      setStatusMsg({ ok: false, text: 'Network error updating status' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (error) return <div style={{ color: 'var(--color-error)' }}>{error}</div>;
  if (!order) return <div>Loading order details...</div>;

  const shipping = typeof order.shippingInfo === 'object' && order.shippingInfo !== null
    ? order.shippingInfo
    : {};

  return (
    <div style={{ maxWidth: 800 }}>
      <Link href="/orders">← Back to Orders</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <h1>Order #{order.id}</h1>
        <div>
          <label style={{ marginRight: 8, fontWeight: 600 }}>Status:</label>
          <select
            value={order.status}
            onChange={(e) => void handleStatusChange(e.target.value)}
            disabled={updatingStatus}
            style={{ padding: '6px 12px', borderRadius: 4, fontWeight: 600 }}
          >
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {statusMsg && (
            <span
              style={{
                marginLeft: 10,
                fontSize: 13,
                color: statusMsg.ok ? 'var(--color-success)' : 'var(--color-error)',
              }}
            >
              {statusMsg.text}
            </span>
          )}
        </div>
      </div>

      <p style={{ opacity: 0.7, marginTop: -8 }}>
        Placed on {new Date(order.createdAt).toLocaleString()}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, margin: '24px 0' }}>
        <div style={{ border: 'var(--border)', padding: 16, borderRadius: 6 }}>
          <h3 style={{ marginTop: 0 }}>Customer Info</h3>
          <div><strong>Name:</strong> {order.customerName || 'N/A'}</div>
          <div><strong>Email:</strong> {order.customerEmail || 'N/A'}</div>
          <div><strong>Account Type:</strong> {order.isGuest ? 'Guest Checkout' : 'Registered User'}</div>
          {order.userId && <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>User ID: {order.userId}</div>}
        </div>

        <div style={{ border: 'var(--border)', padding: 16, borderRadius: 6 }}>
          <h3 style={{ marginTop: 0 }}>Shipping & Payment</h3>
          <div><strong>Recipient:</strong> {shipping.name || order.customerName || 'N/A'}</div>
          <div><strong>Phone:</strong> {shipping.phone || 'N/A'}</div>
          <div><strong>Address:</strong> {shipping.address || 'N/A'}</div>
          <div><strong>City / Postal:</strong> {shipping.city || ''} {shipping.postalCode || ''}</div>
          <div style={{ marginTop: 8 }}><strong>Payment Method:</strong> {order.payment.toUpperCase()}</div>
        </div>
      </div>

      <h2>Items ({order.items.reduce((s, i) => s + i.qty, 0)})</h2>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Variant</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {item.product?.hero && (
                    <img src={item.product.hero} alt="" width={40} height={40} style={{ objectFit: 'cover', borderRadius: 4 }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.product?.name || item.productId}</div>
                    <div style={{ fontSize: 11, opacity: 0.5 }}>ID: {item.productId}</div>
                  </div>
                </div>
              </td>
              <td>{item.color} / {item.size}</td>
              <td>{item.qty}</td>
              <td>Rs. {item.unitPrice.toLocaleString()}</td>
              <td style={{ fontWeight: 600 }}>Rs. {(item.qty * item.unitPrice).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 24, borderTop: 'var(--border)', paddingTop: 16, textAlign: 'right' }}>
        <div>Subtotal: Rs. {order.subtotal.toLocaleString()}</div>
        {order.discount > 0 && (
          <div style={{ color: 'var(--color-success)' }}>
            Promo Discount: −Rs. {order.discount.toLocaleString()}
          </div>
        )}
        <div>Shipping: {order.shipping === 0 ? 'Free' : `Rs. ${order.shipping.toLocaleString()}`}</div>
        <h2 style={{ marginTop: 8 }}>Total: Rs. {order.total.toLocaleString()}</h2>
      </div>
    </div>
  );
}
