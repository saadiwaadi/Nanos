'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { API_BASE } from '@/lib/api';


type Variant = { id: string; color: string; size: string; stock: number };
type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice: number | null;
  isSale: boolean;
  hero: string;
  variants: Variant[];
};
type CategorySettings = { category: string; lowStockThreshold: number };

type SortKey = 'name' | 'price' | 'stock';
type SortDir = 'asc' | 'desc';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [thresholds, setThresholds] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    async function load() {
      // Products and settings are independent — fetch in parallel. A settings
      // failure is non-fatal (stock cells just lose their low-stock tinting).
      const [productsRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/products`, { credentials: 'include' }),
        fetch(`${API_BASE}/admin/settings`, { credentials: 'include' }).catch(() => null),
      ]);
      if (productsRes.status !== 200) {
        setError(`Failed to load products (status ${productsRes.status})`);
        return;
      }
      const data: Product[] = await productsRes.json();
      setProducts(data);
      if (settingsRes && settingsRes.status === 200) {
        const settings: CategorySettings[] = await settingsRes.json();
        const lookup: Record<string, number> = {};
        for (const s of settings) lookup[s.category] = s.lowStockThreshold;
        setThresholds(lookup);
      }
    }
    load();
  }, []);

  const visible = useMemo(() => {
    if (!products) return null;
    const q = query.trim().toLowerCase();
    const filtered = q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
    if (!sortKey) return filtered;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const stockA = a.variants.reduce((s, v) => s + v.stock, 0);
      const stockB = b.variants.reduce((s, v) => s + v.stock, 0);
      const va = sortKey === 'name' ? a.name.toLowerCase() : sortKey === 'price' ? a.price : stockA;
      const vb = sortKey === 'name' ? b.name.toLowerCase() : sortKey === 'price' ? b.price : stockB;
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [products, query, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const indicator = (key: SortKey) => (sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '');

  if (error) return <div style={{ color: 'var(--color-error)' }}>{error}</div>;
  if (!visible) return <div>Loading...</div>;

  return (
    <div>
      <h1>Products ({products?.length ?? 0})</h1>
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Search products…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: 280 }}
        />
      </div>
      <table>
        <thead>
          <tr>
            <th className="sortable-header" onClick={() => toggleSort('name')}>
              Name{indicator('name')}
            </th>
            <th>Category</th>
            <th className="sortable-header" onClick={() => toggleSort('price')}>
              Price{indicator('price')}
            </th>
            <th>Sale</th>
            <th>Variants</th>
            <th className="sortable-header" onClick={() => toggleSort('stock')}>
              Total stock{indicator('stock')}
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {visible.map((p) => {
            const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
            const threshold = thresholds[p.category];
            const onSale = p.isSale || p.oldPrice != null;
            const stockClass =
              totalStock === 0
                ? 'text-error'
                : threshold != null && totalStock < threshold
                  ? 'text-warning'
                  : undefined;
            return (
              <tr key={p.id}>
                <td>
                  {p.name}
                  <div style={{ fontSize: 11, opacity: 0.55 }}>
                    {p.id.length > 12 ? `${p.id.slice(0, 8)}…` : p.id}
                  </div>
                </td>
                <td>{p.category}</td>
                <td className={p.price === 0 ? 'text-error' : undefined}>Rs. {p.price}</td>
                <td>{onSale ? <span className="badge-sale">Sale</span> : null}</td>
                <td>{p.variants.length}</td>
                <td className={stockClass}>{totalStock}</td>
                <td>
                  <Link href={`/products/${p.id}`}>Edit</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
