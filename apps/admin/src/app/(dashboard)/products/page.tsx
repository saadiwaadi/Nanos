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

  // Part 1: Add product state
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    category: 'crocs',
    price: '',
    desc: '',
    hero: '',
    tag: '',
    oldPrice: '',
    isSale: false,
    colorsRaw: '',
    sizesRaw: '',
    galleryRaw: '',
  });
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function load() {
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
  }, [reloadKey]);

  const submitAdd = async () => {
    const parsedPrice = parseInt(addForm.price, 10);
    if (
      !addForm.name.trim() ||
      !addForm.category ||
      isNaN(parsedPrice) ||
      parsedPrice < 0 ||
      !addForm.desc.trim() ||
      !addForm.hero.trim() ||
      !addForm.colorsRaw.trim() ||
      !addForm.sizesRaw.trim()
    ) {
      setAddError('Please fill all required fields.');
      return;
    }

    const parsedOldPrice =
      addForm.oldPrice.trim() === '' ? null : parseInt(addForm.oldPrice, 10);
    const colors = addForm.colorsRaw.split(',').map((s) => s.trim()).filter(Boolean);
    const sizes = addForm.sizesRaw.split(',').map((s) => s.trim()).filter(Boolean);
    const gallery = addForm.galleryRaw.split(',').map((s) => s.trim()).filter(Boolean);

    setAdding(true);
    setAddError(null);

    try {
      const res = await fetch(`${API_BASE}/admin/products`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name.trim(),
          category: addForm.category,
          price: parsedPrice,
          oldPrice: parsedOldPrice,
          tag: addForm.tag.trim() === '' ? null : addForm.tag.trim(),
          desc: addForm.desc.trim(),
          hero: addForm.hero.trim(),
          isSale: addForm.isSale,
          colorsJson: JSON.stringify(colors),
          sizesJson: JSON.stringify(sizes),
          galleryJson: JSON.stringify(gallery),
        }),
      });

      if (res.status !== 201) {
        const body = await res.json().catch(() => null);
        setAddError(`Failed (${res.status})${body?.message ? ' — ' + body.message : ''}`);
        setAdding(false);
        return;
      }

      const created = await res.json();

      for (const color of colors) {
        for (const size of sizes) {
          try {
            await fetch(`${API_BASE}/admin/products/${created.id}/variants`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ color, size, stock: 0 }),
            });
          } catch {
            // continue if single variant fails
          }
        }
      }

      setAdding(false);
      setShowAdd(false);
      setAddError(null);
      setAddForm({
        name: '',
        category: 'crocs',
        price: '',
        desc: '',
        hero: '',
        tag: '',
        oldPrice: '',
        isSale: false,
        colorsRaw: '',
        sizesRaw: '',
        galleryRaw: '',
      });
      setProducts(null);
      setReloadKey((k) => k + 1);
    } catch {
      setAddError('Network error adding product');
      setAdding(false);
    }
  };

  const deleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/products/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.status !== 200) {
        alert(`Delete failed (${res.status})`);
        return;
      }
      setProducts(null);
      setReloadKey((k) => k + 1);
    } catch {
      alert('Delete failed (network error)');
    }
  };

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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0 }}>Products ({products?.length ?? 0})</h1>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setShowAdd(true)}
        >
          + Add product
        </button>
      </div>

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
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{
                      marginLeft: 8,
                      color: 'var(--color-error)',
                      borderColor: 'var(--color-error)',
                      fontSize: 12,
                    }}
                    onClick={() => void deleteProduct(p.id, p.name)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Add Product Modal */}
      {showAdd && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 8,
              padding: 28,
              width: '100%',
              maxWidth: 540,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 24px 60px -20px rgba(0,0,0,0.45)',
              position: 'relative',
            }}
          >
            <button
              type="button"
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                fontSize: 18,
                cursor: 'pointer',
              }}
              onClick={() => {
                setShowAdd(false);
                setAddError(null);
              }}
            >
              ✕
            </button>

            <h2 style={{ margin: '0 0 20px' }}>Add product</h2>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Name</label>
              <input
                style={{ width: '100%' }}
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Category</label>
              <select
                style={{ width: '100%' }}
                value={addForm.category}
                onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}
              >
                <option value="crocs">crocs</option>
                <option value="trousers">trousers</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Price PKR</label>
              <input
                type="number"
                style={{ width: '100%' }}
                value={addForm.price}
                onChange={(e) => setAddForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Old price PKR</label>
              <input
                type="number"
                style={{ width: '100%' }}
                value={addForm.oldPrice}
                onChange={(e) => setAddForm((f) => ({ ...f, oldPrice: e.target.value }))}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Tag</label>
              <input
                style={{ width: '100%' }}
                value={addForm.tag}
                placeholder="New"
                onChange={(e) => setAddForm((f) => ({ ...f, tag: e.target.value }))}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Description</label>
              <textarea
                style={{ width: '100%', height: 80 }}
                value={addForm.desc}
                onChange={(e) => setAddForm((f) => ({ ...f, desc: e.target.value }))}
                required
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Main image URL</label>
              <input
                style={{ width: '100%' }}
                value={addForm.hero}
                onChange={(e) => setAddForm((f) => ({ ...f, hero: e.target.value }))}
                required
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Gallery URLs — comma-separated</label>
              <input
                style={{ width: '100%' }}
                value={addForm.galleryRaw}
                placeholder="https://…, https://… (comma-separated)"
                onChange={(e) => setAddForm((f) => ({ ...f, galleryRaw: e.target.value }))}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Colors — comma-separated names</label>
              <input
                style={{ width: '100%' }}
                value={addForm.colorsRaw}
                placeholder="Black, White, Navy"
                onChange={(e) => setAddForm((f) => ({ ...f, colorsRaw: e.target.value }))}
                required
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Sizes — comma-separated</label>
              <input
                style={{ width: '100%' }}
                value={addForm.sizesRaw}
                placeholder="UK 6, UK 7, UK 8, UK 9"
                onChange={(e) => setAddForm((f) => ({ ...f, sizesRaw: e.target.value }))}
                required
              />
            </div>

            <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="isSale"
                checked={addForm.isSale}
                onChange={(e) => setAddForm((f) => ({ ...f, isSale: e.target.checked }))}
              />
              <label htmlFor="isSale" style={{ fontWeight: 600 }}>Is Sale</label>
            </div>

            {addError && (
              <div style={{ color: 'var(--color-error)', marginBottom: 12, fontSize: 13 }}>
                {addError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowAdd(false);
                  setAddError(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={adding}
                onClick={() => void submitAdd()}
              >
                {adding ? 'Adding…' : 'Add product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
