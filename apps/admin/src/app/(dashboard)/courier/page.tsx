'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApiFetch } from '@/lib/api';

interface BookingLog {
  id: string;
  attemptedAt: string;
  requestPayload: any;
  responsePayload: any;
  success: boolean;
  errorMessage?: string;
}

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  color: string;
  size: string;
  qty: number;
  unitPrice: number;
}

interface Order {
  id: string;
  userId?: string;
  guestEmail?: string;
  guestName?: string;
  total: number;
  shippingInfo: any;
  status: string;
  postexTrackingNumber?: string;
  postexStatus?: string;
  courierBookingStatus?: string;
  adminApproved: boolean;
  createdAt: string;
  bookingLogs?: BookingLog[];
}

interface QueueData {
  awaitingApproval: Order[];
  queuedForBatch: Order[];
  failedBookings: Order[];
  bookedOrders: Order[];
}

interface CitiesData {
  defaultCities: string[];
  dbCities: { id: string; cityName: string; enabled: boolean }[];
}

export default function CourierQueuePage() {
  const [queue, setQueue] = useState<QueueData>({
    awaitingApproval: [],
    queuedForBatch: [],
    failedBookings: [],
    bookedOrders: [],
  });
  const [cities, setCities] = useState<CitiesData>({ defaultCities: [], dbCities: [] });
  const [newCity, setNewCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchQueueData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApiFetch<QueueData>('/admin/courier-queue');
      setQueue(data);
      const cityData = await adminApiFetch<CitiesData>('/admin/courier-queue/cities');
      setCities(cityData);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to fetch courier queue' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueueData();
  }, [fetchQueueData]);

  const handleApprove = async (orderId: string) => {
    setActionLoading(`approve-${orderId}`);
    setMsg(null);
    try {
      await adminApiFetch(`/admin/courier-queue/${orderId}/approve`, {
        method: 'PATCH',
      });
      setMsg({ type: 'success', text: `Order ${orderId} approved for next batch booking.` });
      await fetchQueueData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to approve order' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetry = async (orderId: string) => {
    setActionLoading(`retry-${orderId}`);
    setMsg(null);
    try {
      const res = await adminApiFetch<{ success: boolean; errorMessage?: string }>(
        `/admin/courier-queue/${orderId}/retry`,
        { method: 'POST' }
      );
      if (res.success) {
        setMsg({ type: 'success', text: `Order ${orderId} successfully booked!` });
      } else {
        setMsg({ type: 'error', text: `Booking failed: ${res.errorMessage || 'Unknown error'}` });
      }
      await fetchQueueData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Retry failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRunBatchNow = async () => {
    setActionLoading('run-batch');
    setMsg(null);
    try {
      const res = await adminApiFetch<any[]>('/admin/courier-queue/run-batch-now', {
        method: 'POST',
      });
      setMsg({
        type: 'success',
        text: `Batch booking process completed! Processed ${res.length} orders.`,
      });
      await fetchQueueData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Batch execution failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity.trim()) return;
    try {
      await adminApiFetch('/admin/courier-queue/cities', {
        method: 'PUT',
        body: JSON.stringify({ cityName: newCity.trim(), enabled: true }),
      });
      setNewCity('');
      setMsg({ type: 'success', text: `Added ${newCity.trim()} to auto-book cities.` });
      await fetchQueueData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update city' });
    }
  };

  const handleToggleCity = async (cityName: string, currentEnabled: boolean) => {
    try {
      await adminApiFetch('/admin/courier-queue/cities', {
        method: 'PUT',
        body: JSON.stringify({ cityName, enabled: !currentEnabled }),
      });
      await fetchQueueData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to toggle city' });
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>PostEx Courier Queue</h1>
          <p style={{ color: 'var(--color-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>
            Batched daily booking, city routing &amp; error tracking
          </p>
        </div>
        <button
          onClick={handleRunBatchNow}
          disabled={actionLoading === 'run-batch'}
          style={{
            background: 'var(--color-accent)',
            color: '#000',
            fontWeight: 600,
            padding: '10px 18px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {actionLoading === 'run-batch' ? 'Processing Batch...' : '▶ Run Batch Booking Now'}
        </button>
      </div>

      {msg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 6,
            marginBottom: 20,
            fontSize: 14,
            fontWeight: 500,
            backgroundColor: msg.type === 'success' ? '#e8f5e9' : '#ffebee',
            color: msg.type === 'success' ? '#2e7d32' : '#c62828',
            border: `1px solid ${msg.type === 'success' ? '#a5d6a7' : '#ef9a9a'}`,
          }}
        >
          {msg.text}
        </div>
      )}

      {loading ? (
        <p>Loading courier queue data...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Section 1: Awaiting Manual Approval */}
          <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e0e0e0' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px 0' }}>
              1. Awaiting Manual Approval ({queue.awaitingApproval.length})
            </h2>
            {queue.awaitingApproval.length === 0 ? (
              <p style={{ color: '#666', fontSize: 14, margin: 0 }}>
                No orders currently awaiting manual review.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: '8px' }}>Order ID</th>
                    <th style={{ padding: '8px' }}>Customer / City</th>
                    <th style={{ padding: '8px' }}>Total</th>
                    <th style={{ padding: '8px' }}>Date</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.awaitingApproval.map((order) => {
                    const shipping = order.shippingInfo || {};
                    return (
                      <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>{order.id}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <div>{shipping.name || order.guestName}</div>
                          <div style={{ fontSize: 12, color: '#666' }}>{shipping.city || 'Unknown'}</div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>PKR {order.total?.toLocaleString()}</td>
                        <td style={{ padding: '12px 8px', fontSize: 12, color: '#666' }}>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleApprove(order.id)}
                            disabled={actionLoading === `approve-${order.id}`}
                            style={{
                              padding: '6px 14px',
                              background: '#2e7d32',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: 13,
                            }}
                          >
                            Approve for Booking
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Section 2: Failed Bookings */}
          <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #ef9a9a' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px 0', color: '#c62828' }}>
              2. Failed Bookings ({queue.failedBookings.length})
            </h2>
            {queue.failedBookings.length === 0 ? (
              <p style={{ color: '#666', fontSize: 14, margin: 0 }}>No failed bookings recorded.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ffcdd2' }}>
                    <th style={{ padding: '8px' }}>Order ID</th>
                    <th style={{ padding: '8px' }}>Customer / City</th>
                    <th style={{ padding: '8px' }}>Error Details</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.failedBookings.map((order) => {
                    const shipping = order.shippingInfo || {};
                    const latestLog = order.bookingLogs?.[0];
                    return (
                      <tr key={order.id} style={{ borderBottom: '1px solid #ffebee' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>{order.id}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <div>{shipping.name || order.guestName}</div>
                          <div style={{ fontSize: 12, color: '#666' }}>{shipping.city}</div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span
                            style={{
                              background: '#ffebee',
                              color: '#c62828',
                              padding: '4px 8px',
                              borderRadius: 4,
                              fontFamily: 'monospace',
                              fontSize: 12,
                              display: 'inline-block',
                            }}
                          >
                            {latestLog?.errorMessage || 'Unknown PostEx API Error'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleRetry(order.id)}
                            disabled={actionLoading === `retry-${order.id}`}
                            style={{
                              padding: '6px 14px',
                              background: '#d32f2f',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: 13,
                            }}
                          >
                            {actionLoading === `retry-${order.id}` ? 'Retrying...' : 'Retry Booking'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Section 3: Queued for Next Batch */}
          <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e0e0e0' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px 0' }}>
              3. Queued for Next Batch ({queue.queuedForBatch.length})
            </h2>
            {queue.queuedForBatch.length === 0 ? (
              <p style={{ color: '#666', fontSize: 14, margin: 0 }}>No orders queued for the next daily batch.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: '8px' }}>Order ID</th>
                    <th style={{ padding: '8px' }}>Customer / City</th>
                    <th style={{ padding: '8px' }}>Booking Type</th>
                    <th style={{ padding: '8px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.queuedForBatch.map((order) => {
                    const shipping = order.shippingInfo || {};
                    return (
                      <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>{order.id}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <div>{shipping.name || order.guestName}</div>
                          <div style={{ fontSize: 12, color: '#666' }}>{shipping.city}</div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: 4,
                              fontSize: 12,
                              fontWeight: 600,
                              backgroundColor:
                                order.courierBookingStatus === 'pending_auto' ? '#e3f2fd' : '#fff3e0',
                              color: order.courierBookingStatus === 'pending_auto' ? '#1565c0' : '#e65100',
                            }}
                          >
                            {order.courierBookingStatus === 'pending_auto' ? 'Auto City' : 'Approved Manual'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px' }}>PKR {order.total?.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Section 4: Auto-Book Cities Settings */}
          <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e0e0e0' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px 0' }}>
              4. Auto-Book Cities Configuration
            </h2>
            <p style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>
              Orders placed from auto-book cities are automatically queued for the daily batch. Orders from other cities require manual admin approval before booking.
            </p>

            <form onSubmit={handleAddCity} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <input
                type="text"
                placeholder="Enter city name (e.g. Rawalpindi)"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14 }}
              />
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  background: 'var(--color-ink)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Add City
              </button>
            </form>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {cities.defaultCities.map((cityName) => (
                <div
                  key={cityName}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 16,
                    background: '#e8f5e9',
                    color: '#2e7d32',
                    fontWeight: 600,
                    fontSize: 13,
                    border: '1px solid #a5d6a7',
                  }}
                >
                  {cityName} (Default Auto)
                </div>
              ))}
              {cities.dbCities.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleToggleCity(c.cityName, c.enabled)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 16,
                    background: c.enabled ? '#e8f5e9' : '#f5f5f5',
                    color: c.enabled ? '#2e7d32' : '#757575',
                    fontWeight: 600,
                    fontSize: 13,
                    border: `1px solid ${c.enabled ? '#a5d6a7' : '#e0e0e0'}`,
                    cursor: 'pointer',
                  }}
                >
                  {c.cityName} {c.enabled ? '✓' : '(Disabled)'}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
