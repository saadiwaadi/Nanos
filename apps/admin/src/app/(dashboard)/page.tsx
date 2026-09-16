'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';

interface ProductVariant {
  id: string;
  color: string;
  size: string;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number | null;
  isSale?: boolean;
  hero: string;
  variants?: ProductVariant[];
}

interface OrderItem {
  id: string;
  productId: string;
  color: string;
  size: string;
  qty: number;
  unitPrice: number;
}

interface Order {
  id: string;
  createdAt: string;
  userId?: string | null;
  guestEmail?: string | null;
  guestName?: string | null;
  customerName?: string | null;
  total: number;
  status: string;
  items?: OrderItem[];
}

const statusStyleMap: Record<string, { bg: string; color: string }> = {
  processing: { bg: '#fff8e1', color: '#b78103' },
  shipped: { bg: '#e3f2fd', color: '#1565c0' },
  delivered: { bg: '#e8f5e9', color: '#2e7d32' },
  cancelled: { bg: '#ffebee', color: '#c62828' },
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          fetch(`${API_BASE}/admin/orders?page=1&limit=500`, { credentials: 'include' }),
          fetch(`${API_BASE}/admin/products`, { credentials: 'include' }),
        ]);

        if (ordersRes.status === 401) {
          window.location.href = '/';
          return;
        }

        if (!ordersRes.ok) {
          setError(`Failed to load orders (Status ${ordersRes.status})`);
          setLoading(false);
          return;
        }

        const ordersData = await ordersRes.json();
        const ordersArray: Order[] = Array.isArray(ordersData)
          ? ordersData
          : ordersData.orders || ordersData.data || [];
        setOrders(ordersArray);

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          const productsArray: Product[] = Array.isArray(productsData)
            ? productsData
            : productsData.products || productsData.data || [];
          setProducts(productsArray);
        } else {
          setProducts([]);
        }
      } catch (err: any) {
        setError(err.message || 'Network error loading dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <div>Loading dashboard…</div>;
  }

  if (error) {
    return <div style={{ color: 'var(--color-error)' }}>{error}</div>;
  }

  // Derived values
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'processing').length;

  const todayStr = new Date().toDateString();
  const todayRevenue = orders
    .filter(
      (o) =>
        new Date(o.createdAt).toDateString() === todayStr &&
        o.status !== 'cancelled',
    )
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const deliveredRevenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const soldOutProducts = products.filter((p) => {
    const variants = p.variants || [];
    return variants.reduce((s, v) => s + (v.stock || 0), 0) === 0;
  });

  // 7-day order bar chart data (last 7 days, index 0 to 6 = 6 days ago up to today)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const chartData = last7Days.map((day) => {
    const dayStr = day.toDateString();
    const count = orders.filter(
      (o) => new Date(o.createdAt).toDateString() === dayStr,
    ).length;
    const label = day.toLocaleDateString('en-US', { weekday: 'short' });
    return { day, label, count };
  });

  const maxCount = Math.max(...chartData.map((d) => d.count), 1);
  const maxBarHeight = 65; // max SVG height for bar body

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div>
      {/* Row 1 — 4 Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: '#ffffff',
            border: 'var(--border)',
            borderRadius: 'var(--radius)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              opacity: 0.55,
              letterSpacing: '0.06em',
            }}
          >
            Total orders
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
            }}
          >
            {totalOrders}
          </div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>all time</div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: 'var(--border)',
            borderRadius: 'var(--radius)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              opacity: 0.55,
              letterSpacing: '0.06em',
            }}
          >
            Pending
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              color: pendingOrders > 0 ? 'var(--color-warning)' : 'inherit',
            }}
          >
            {pendingOrders}
          </div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            {pendingOrders > 0 ? 'needs action' : 'all clear'}
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: 'var(--border)',
            borderRadius: 'var(--radius)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              opacity: 0.55,
              letterSpacing: '0.06em',
            }}
          >
            Today's revenue
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
            }}
          >
            Rs. {todayRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>{todayFormatted}</div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: 'var(--border)',
            borderRadius: 'var(--radius)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              opacity: 0.55,
              letterSpacing: '0.06em',
            }}
          >
            Delivered revenue
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
            }}
          >
            Rs. {deliveredRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>from delivered orders</div>
        </div>
      </div>

      {/* Row 2 — 2 Panels Side by Side */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Left Panel: 7-day order chart */}
        <div
          style={{
            background: '#ffffff',
            border: 'var(--border)',
            borderRadius: 'var(--radius)',
          }}
        >
          <div
            style={{
              padding: '14px 18px',
              borderBottom: 'var(--border)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            Orders – last 7 days
          </div>
          <div style={{ padding: '14px 18px' }}>
            <svg viewBox="0 0 420 120" width="100%" height="120">
              {chartData.map((d, index) => {
                const barWidth = 40;
                const gap = 12;
                const x = 34 + index * (barWidth + gap);
                const rawHeight = (d.count / maxCount) * maxBarHeight;
                const barHeight =
                  d.count > 0 ? Math.max(rawHeight, 2) : 0;
                const y = 85 - barHeight;

                return (
                  <g key={index}>
                    {/* Count label above bar if count > 0 */}
                    {d.count > 0 && (
                      <text
                        x={x + barWidth / 2}
                        y={y - 4}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="700"
                        fill="var(--color-ink)"
                      >
                        {d.count}
                      </text>
                    )}
                    {/* Bar */}
                    {barHeight > 0 && (
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        rx="3"
                        fill="var(--color-accent)"
                      />
                    )}
                    {/* Baseline */}
                    <line
                      x1={x}
                      y1="85"
                      x2={x + barWidth}
                      y2="85"
                      stroke="#e0e0e0"
                      strokeWidth="1"
                    />
                    {/* Weekday X-axis label */}
                    <text
                      x={x + barWidth / 2}
                      y="105"
                      textAnchor="middle"
                      fontSize="12"
                      fill="var(--color-ink)"
                      opacity="0.75"
                    >
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right Panel: Inventory Alerts */}
        <div
          style={{
            background: '#ffffff',
            border: 'var(--border)',
            borderRadius: 'var(--radius)',
          }}
        >
          <div
            style={{
              padding: '14px 18px',
              borderBottom: 'var(--border)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            Inventory alerts
          </div>
          <div style={{ padding: '14px 18px' }}>
            {soldOutProducts.length === 0 ? (
              <div style={{ opacity: 0.5, fontSize: 13 }}>No stock issues.</div>
            ) : (
              soldOutProducts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: 'var(--border)',
                    fontSize: 13.5,
                  }}
                >
                  <span>{p.name}</span>
                  <span style={{ color: 'var(--color-error)', fontWeight: 700 }}>
                    Sold out
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 3 — Recent Orders Panel */}
      <div
        style={{
          background: '#ffffff',
          border: 'var(--border)',
          borderRadius: 'var(--radius)',
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: 'var(--border)',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: 15,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Recent orders</span>
          <Link
            href="/orders"
            style={{
              fontSize: 13,
              opacity: 0.7,
              textDecoration: 'underline',
            }}
          >
            View all
          </Link>
        </div>
        <div style={{ padding: '14px 18px' }}>
          {recentOrders.length === 0 ? (
            <div style={{ opacity: 0.5, fontSize: 13 }}>No recent orders.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => {
                  const style = statusStyleMap[o.status] || {
                    bg: '#f5f5f5',
                    color: '#616161',
                  };
                  const dateStr = new Date(o.createdAt).toLocaleDateString(
                    'en-GB',
                    { day: '2-digit', month: 'short', year: 'numeric' },
                  );
                  const customerName =
                    o.customerName || o.guestName || 'Guest';

                  return (
                    <tr key={o.id}>
                      <td>
                        <Link href={`/orders/${o.id}`}>
                          #{o.id.slice(-8)}
                        </Link>
                      </td>
                      <td>{dateStr}</td>
                      <td>{customerName}</td>
                      <td style={{ fontWeight: 600 }}>
                        Rs. {o.total.toLocaleString()}
                      </td>
                      <td>
                        <span
                          style={{
                            background: style.bg,
                            color: style.color,
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 700,
                            textTransform: 'capitalize',
                          }}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
