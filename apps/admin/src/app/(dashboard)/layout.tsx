'use client';

import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';

import { API_BASE } from '@/lib/api';


export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/auth/admin/me`, { credentials: 'include' });
        if (res.status === 200) {
          const data = await res.json().catch(() => null);
          setEmail(typeof data?.email === 'string' ? data.email : null);
          setChecked(true);
        } else {
          window.location.href = '/';
        }
      } catch {
        window.location.href = '/';
      }
    }
    load();
  }, []);

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/admin/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // still redirect even if the logout call fails
    }
    window.location.href = '/';
  };

  if (!checked) return null;

  return (
    <div style={{ minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: 220, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            padding: '10px 24px',
            borderBottom: 'var(--border)',
            background: 'var(--color-bg)',
          }}
        >
          {email && <span>{email}</span>}
          <button
            type="button"
            onClick={() => void logout()}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              textDecoration: 'underline',
              color: 'var(--color-ink)',
              font: 'inherit',
            }}
          >
            Log out
          </button>
        </header>
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>{children}</main>
      </div>
    </div>
  );
}
