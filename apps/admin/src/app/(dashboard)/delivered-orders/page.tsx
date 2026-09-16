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

const PAGE_SIZE = 200;

type CustomerFilter = 'all' | 'guest' | 'account';
type PresetDateFilter = 'all' | 'today' | 'yesterday' | '7days' | '30days' | 'thisMonth' | 'custom';

export default function DeliveredOrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [meta, setMeta] = useState<OrderListResponse['meta'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  // Filters
  const [customerFilter, setCustomerFilter] = useState<CustomerFilter>('all');
  const [presetDate, setPresetDate] = useState<PresetDateFilter>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
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
      // Filter strictly for delivered status and sort latest to oldest
      const delivered = (data.data || [])
        .filter((o) => o.status.toLowerCase() === 'delivered')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setOrders((prev) => (append && prev ? [...prev, ...delivered] : delivered));
    } catch {
      if (append) setLoadMoreError('Network error while loading more orders');
      else setError('Network error while fetching delivered orders');
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

  // Handle Preset Date selection
  const handlePresetChange = (preset: PresetDateFilter) => {
    setPresetDate(preset);
    const now = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const todayStr = formatDate(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = formatDate(y);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === '7days') {
      const d7 = new Date(now);
      d7.setDate(d7.getDate() - 7);
      setStartDate(formatDate(d7));
      setEndDate(formatDate(now));
    } else if (preset === '30days') {
      const d30 = new Date(now);
      d30.setDate(d30.getDate() - 30);
      setStartDate(formatDate(d30));
      setEndDate(formatDate(now));
    } else if (preset === 'thisMonth') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(formatDate(startOfMonth));
      setEndDate(formatDate(now));
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    return orders.filter((o) => {
      // 1. Customer Type Filter
      if (customerFilter === 'guest' && !o.isGuest) return false;
      if (customerFilter === 'account' && o.isGuest) return false;

      // 2. Calendar / Date Range Filter
      const createdDateStr = o.createdAt.split('T')[0];
      if (startDate && createdDateStr < startDate) return false;
      if (endDate && createdDateStr > endDate) return false;

      // 3. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = o.customerName?.toLowerCase().includes(q) ?? false;
        const matchesEmail = o.customerEmail?.toLowerCase().includes(q) ?? false;
        const matchesId = o.id.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesId) return false;
      }

      return true;
    });
  }, [orders, customerFilter, startDate, endDate, searchQuery]);

  // Calculate metrics for filtered range
  const metrics = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const totalItems = filteredOrders.reduce((sum, o) => sum + o.itemCount, 0);
    return { count: filteredOrders.length, revenue: totalRevenue, items: totalItems };
  }, [filteredOrders]);

  if (error) return <div style={{ color: 'var(--color-error)' }}>{error}</div>;
  if (!orders) return <div>Loading delivered orders...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>Delivered Orders Archive</h1>
          <p style={{ opacity: 0.6, fontSize: 13, marginTop: 4, marginBottom: 0 }}>
            Automatically moves delivered orders into chronological history (Latest → Oldest)
          </p>
        </div>
      </div>

      {/* Metrics Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div style={{ background: '#ffffff', border: 'var(--border)', padding: 16, borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.6, textTransform: 'uppercase' }}>Delivered Orders</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, color: 'var(--color-success)' }}>
            {metrics.count} <span style={{ fontSize: 13, fontWeight: 400, color: '#666' }}>({orders.length} total)</span>
          </div>
        </div>
        <div style={{ background: '#ffffff', border: 'var(--border)', padding: 16, borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.6, textTransform: 'uppercase' }}>Delivered Value</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>
            Rs. {metrics.revenue.toLocaleString()}
          </div>
        </div>
        <div style={{ background: '#ffffff', border: 'var(--border)', padding: 16, borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.6, textTransform: 'uppercase' }}>Items Delivered</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>
            {metrics.items}
          </div>
        </div>
      </div>

      {/* Filter Toolbar with Calendar Specifications */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          alignItems: 'flex-end',
          padding: 16,
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
            style={{ width: 200 }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, opacity: 0.7 }}>
            DATE PRESETS
          </label>
          <select value={presetDate} onChange={(e) => handlePresetChange(e.target.value as PresetDateFilter)}>
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, opacity: 0.7 }}>
            FROM DATE 📅
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPresetDate('custom');
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, opacity: 0.7 }}>
            TO DATE 📅
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPresetDate('custom');
            }}
          />
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

        {(customerFilter !== 'all' || presetDate !== 'all' || startDate !== '' || endDate !== '' || searchQuery !== '') && (
          <div>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: 12, padding: '7px 12px' }}
              onClick={() => {
                setCustomerFilter('all');
                setPresetDate('all');
                setStartDate('');
                setEndDate('');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', border: 'var(--border)', background: '#fff', borderRadius: 'var(--radius)' }}>
          No delivered orders found for the selected date range or criteria.
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Delivered Date & Time</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((o) => {
              const dateObj = new Date(o.createdAt);
              const dateStr = dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const timeStr = dateObj.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <tr key={o.id}>
                  <td>
                    <Link href={`/orders/${o.id}`} style={{ fontWeight: 600 }}>
                      #{o.id.slice(-8)}
                    </Link>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{dateStr}</div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>{timeStr}</div>
                  </td>
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
                        backgroundColor: '#eaf5ea',
                        color: 'var(--color-success)',
                        border: '1px solid #c8e6c9',
                        textTransform: 'capitalize',
                      }}
                    >
                      ✓ Delivered
                    </span>
                  </td>
                  <td>
                    <Link href={`/orders/${o.id}`} style={{ fontSize: 13, fontWeight: 600 }}>
                      View Details
                    </Link>
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
            {loadingMore ? 'Loading…' : 'Load more history'}
          </button>
        </div>
      )}
      {!hasMore && orders.length > 0 && (
        <p style={{ textAlign: 'center', opacity: 0.6, fontSize: 13, marginTop: 20 }}>
          Full delivered history loaded ({orders.length} orders).
        </p>
      )}
    </div>
  );
}
