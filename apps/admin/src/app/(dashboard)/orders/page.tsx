'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';

type OrderSummary = {
  id: string;
  createdAt: string;
  userId: string | null;
  customerEmail: string | null;
  customerName: string | null;
  isGuest: boolean;
  itemCount: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment: string;
  status: string;
};

type OrderListResponse = {
  data: OrderSummary[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const PAGE_SIZE = 100;

type StatusFilter = 'all' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
type CustomerFilter = 'all' | 'guest' | 'account';
type DateFilter = 'all' | 'today' | '7days' | '30days';

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [meta, setMeta] = useState<OrderListResponse['meta'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  // Filter States
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [customerFilter, setCustomerFilter] = useState<CustomerFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPage = useCallback(async (page: number, append: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/admin/orders?page=${page}&limit=${PAGE_SIZE}`, {
        credentials: 'include',
      });
      if (res.status === 401) {
        window.location.href = '/';
        return;
      }
      if (res.status !== 200) {
        if (append) setLoadMoreError(`Failed to load more orders (status ${res.status})`);
        else setError(`Failed to load orders (status ${res.status})`);
        return;
      }
      const data: OrderListResponse = await res.json();
      setMeta(data.meta);
      setOrders((prev) => (append && prev ? [...prev, ...data.data] : data.data));
    } catch {
      if (append) setLoadMoreError('Network error while loading more orders');
      else setError('Network error while fetching orders');
    }
  }, []);

  useEffect(() => {
    void fetchPage(1, false);
  }, [fetchPage]);

  const hasMore = meta != null && meta.page < meta.totalPages;

  const loadMore = async () => {
    if (!meta || loadingMore) return;
    setLoadingMore(true);
    setLoadMoreError(null);
    await fetchPage(meta.page + 1, true);
    setLoadingMore(false);
  };

  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    return orders.filter((o) => {
      // 1. Status Filter
      if (statusFilter !== 'all' && o.status !== statusFilter) {
        return false;
      }

      // 2. Customer Type Filter
      if (customerFilter === 'guest' && !o.isGuest) return false;
      if (customerFilter === 'account' && o.isGuest) return false;

      // 3. Date Filter
      const createdTime = new Date(o.createdAt).getTime();
      if (dateFilter === 'today' && createdTime < todayStart) return false;
      if (dateFilter === '7days' && createdTime < sevenDaysAgo) return false;
      if (dateFilter === '30days' && createdTime < thirtyDaysAgo) return false;

      // 4. Search Filter (name, email, order ID)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = o.customerName?.toLowerCase().includes(q) ?? false;
        const matchesEmail = o.customerEmail?.toLowerCase().includes(q) ?? false;
        const matchesId = o.id.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesId) return false;
      }

      return true;
    });
  }, [orders, statusFilter, customerFilter, dateFilter, searchQuery]);

  if (error) return <div style={{ color: 'var(--color-error)' }}>{error}</div>;
  if (!orders) return <div>Loading orders...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>
          Orders ({filteredOrders.length} matching · {orders.length} of{' '}
          {meta?.total ?? orders.length} loaded)
        </h1>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          padding: 14,
          marginBottom: 20,
          background: '#ffffff',
          border: 'var(--border)',
          borderRadius: 'var(--radius)',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, opacity: 0.7 }}>
            SEARCH
          </label>
          <input
            type="text"
            placeholder="Search name, email, ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 220 }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, opacity: 0.7 }}>
            STATUS
          </label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
            <option value="all">All Statuses</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, opacity: 0.7 }}>
            CUSTOMER TYPE
          </label>
          <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value as CustomerFilter)}>
            <option value="all">All Customers</option>
            <option value="account">Account Only</option>
            <option value="guest">Guest Only</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, opacity: 0.7 }}>
            DATE RANGE
          </label>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)}>
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>

        {(statusFilter !== 'all' || customerFilter !== 'all' || dateFilter !== 'all' || searchQuery !== '') && (
          <div style={{ alignSelf: 'flex-end' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: 12, padding: '5px 10px' }}
              onClick={() => {
                setStatusFilter('all');
                setCustomerFilter('all');
                setDateFilter('all');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {filteredOrders.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', border: 'var(--border)', background: '#fff', borderRadius: 'var(--radius)' }}>
          No orders match the selected filters.
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((o) => {
              const dateStr = new Date(o.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              // Status badge style map
              const statusStyleMap: Record<string, { bg: string; color: string; border: string }> = {
                processing: { bg: '#fff8e6', color: '#b8860b', border: '#f0e6c2' },
                shipped: { bg: '#eef6fc', color: '#1d6f8a', border: '#d0e4f5' },
                delivered: { bg: '#eaf5ea', color: 'var(--color-success)', border: '#c8e6c9' },
                cancelled: { bg: '#fdeded', color: 'var(--color-error)', border: '#f5c6cb' },
              };

              const statusStyle = statusStyleMap[o.status] || {
                bg: '#f5f5f5',
                color: '#666666',
                border: '#e0e0e0',
              };

              return (
                <tr key={o.id}>
                  <td>
                    <Link href={`/orders/${o.id}`} style={{ fontWeight: 600 }}>
                      #{o.id.slice(-8)}
                    </Link>
                  </td>
                  <td style={{ fontSize: 13 }}>{dateStr}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600 }}>{o.customerName || 'N/A'}</span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: 3,
                          textTransform: 'uppercase',
                          backgroundColor: o.isGuest ? '#e0e0e0' : 'var(--color-ink)',
                          color: o.isGuest ? '#444444' : '#ffffff',
                        }}
                      >
                        {o.isGuest ? 'Guest' : 'Account'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                      {o.customerEmail || 'No email'}
                    </div>
                  </td>
                  <td>{o.itemCount}</td>
                  <td style={{ fontWeight: 600 }}>Rs. {o.total.toLocaleString()}</td>
                  <td style={{ textTransform: 'uppercase', fontSize: 12 }}>{o.payment}</td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 700,
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                        border: `1px solid ${statusStyle.border}`,
                        textTransform: 'capitalize',
                      }}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td>
                    <Link href={`/orders/${o.id}`}>View</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {hasMore && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            marginTop: 20,
          }}
        >
          {loadMoreError && (
            <div style={{ color: 'var(--color-error)', fontSize: 13 }}>{loadMoreError}</div>
          )}
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void loadMore()}
            disabled={loadingMore}
          >
            {loadingMore
              ? 'Loading…'
              : `Load more orders (${orders.length} of ${meta?.total ?? '…'} loaded)`}
          </button>
        </div>
      )}
      {!hasMore && orders.length > 0 && (
        <p style={{ textAlign: 'center', opacity: 0.6, fontSize: 13, marginTop: 20 }}>
          All {orders.length} orders loaded.
        </p>
      )}
    </div>
  );
}
