'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/products', label: 'Products' },
  { href: '/size-charts', label: 'Size Charts' },
  { href: '/settings', label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        width: 220,
        background: 'var(--color-ink)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '20px 20px 24px',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: 18,
          color: '#ffffff',
          letterSpacing: '-0.01em',
        }}
      >
        nanos<span style={{ color: 'var(--color-accent)' }}>.</span>pk
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'block',
                padding: '10px 20px',
                textDecoration: 'none',
                color: active ? '#ffffff' : 'var(--color-secondary)',
                borderLeft: active ? '3px solid var(--color-accent)' : '3px solid transparent',
                fontWeight: active ? 700 : 400,
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
