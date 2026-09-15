'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const API_BASE = 'http://localhost:4000';

type Variant = { id: string; color: string; size: string; stock: number };
type Product = {
  id: string;
  name: string;
  category: string;
  tag: string | null;
  price: number;
  oldPrice: number | null;
  desc: string;
  hero: string;
  galleryJson: string;
  variants: Variant[];
};

type CellStatus = 'idle' | 'saving' | 'saved' | 'error';
type CellState = {
  draft: string;
  committed: number;
  status: CellStatus;
  error: string | null;
};

const label: React.CSSProperties = {
  display: 'block',
  marginTop: 12,
  marginBottom: 4,
  fontWeight: 600,
};
const inputStyle: React.CSSProperties = { width: 400 };

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // non-variant form fields
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState(''); // '' = null
  const [tag, setTag] = useState(''); // '' = null
  const [hero, setHero] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);

  // variant stock grid: key = `${color}|${size}`
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [cells, setCells] = useState<Record<string, CellState>>({});

  useEffect(() => {
    async function load() {
      const res = await fetch(`${API_BASE}/admin/products/${id}`, {
        credentials: 'include',
      });
      if (res.status === 401) {
        window.location.href = '/';
        return;
      }
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (res.status !== 200) {
        setError(`Failed to load product (status ${res.status})`);
        return;
      }
      const data: Product = await res.json();
      setProduct(data);
      setName(data.name);
      setDesc(data.desc);
      setPrice(String(data.price));
      setOldPrice(data.oldPrice == null ? '' : String(data.oldPrice));
      setTag(data.tag ?? '');
      setHero(data.hero);
      let imgs: string[] = [];
      try {
        const parsed = JSON.parse(data.galleryJson);
        if (Array.isArray(parsed)) imgs = parsed.map(String);
      } catch {
        // leave gallery empty if malformed
      }
      setGallery(imgs);

      const uniqColors = [...new Set(data.variants.map((v) => v.color))].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      );
      const uniqSizes = [...new Set(data.variants.map((v) => v.size))].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      );
      setColors(uniqColors);
      setSizes(uniqSizes);
      const nextCells: Record<string, CellState> = {};
      for (const v of data.variants) {
        nextCells[`${v.color}|${v.size}`] = {
          draft: String(v.stock),
          committed: v.stock,
          status: 'idle',
          error: null,
        };
      }
      setCells(nextCells);
    }
    load();
  }, [id]);

  const patchVariant = async (color: string, size: string, cell: CellState) => {
    const key = `${color}|${size}`;
    const parsed = Number(cell.draft);
    if (!Number.isInteger(parsed) || parsed < 0) {
      setCells((c) => ({
        ...c,
        [key]: { ...cell, status: 'error', error: 'Must be a whole number ≥ 0' },
      }));
      return;
    }
    if (parsed === cell.committed) {
      setCells((c) => ({ ...c, [key]: { ...cell, status: 'idle', error: null } }));
      return;
    }
    setCells((c) => ({ ...c, [key]: { ...cell, status: 'saving', error: null } }));
    try {
      const res = await fetch(
        `${API_BASE}/admin/products/${id}/variants/${encodeURIComponent(color)}/${encodeURIComponent(size)}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock: parsed }),
        },
      );
      if (res.status === 200) {
        const cleared: CellState = { draft: cell.draft, committed: parsed, status: 'saved', error: null };
        setCells((c) => ({ ...c, [key]: cleared }));
        setTimeout(() => {
          setCells((c) =>
            c[key] && c[key].status === 'saved' ? { ...c, [key]: { ...cleared, status: 'idle' } } : c,
          );
        }, 2000);
      } else {
        setCells((c) => ({
          ...c,
          [key]: { ...cell, status: 'error', error: `Save failed (status ${res.status})` },
        }));
      }
    } catch {
      setCells((c) => ({ ...c, [key]: { ...cell, status: 'error', error: 'Save failed (network)' } }));
    }
  };

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const saveProduct = async () => {
    if (!product) return;
    const parsedPrice = Number(price);
    if (!Number.isInteger(parsedPrice) || parsedPrice < 0) {
      setSaveMsg({ ok: false, text: 'Price must be a whole number ≥ 0' });
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`${API_BASE}/admin/products/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          desc,
          price: parsedPrice,
          oldPrice: oldPrice.trim() === '' ? null : Number(oldPrice),
          tag: tag.trim() === '' ? null : tag,
          hero,
          galleryJson: JSON.stringify(gallery.filter((g) => g.trim() !== '')),
        }),
      });
      if (res.status === 200) {
        setSaveMsg({ ok: true, text: 'Saved' });
      } else {
        setSaveMsg({ ok: false, text: `Save failed (status ${res.status})` });
      }
    } catch {
      setSaveMsg({ ok: false, text: 'Save failed (network error)' });
    } finally {
      setSaving(false);
    }
  };

  if (notFound) {
    return (
      <div>
        <p>Product not found</p>
        <Link href="/products">Back to Products</Link>
      </div>
    );
  }
  if (error) return <div style={{ color: 'var(--color-error)' }}>{error}</div>;
  if (!product) return <div>Loading...</div>;

  return (
    <div>
      <Link href="/products">← Back to Products</Link>
      <h1>Edit product</h1>

      <label style={label}>Name</label>
      <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />

      <label style={label}>Description</label>
      <textarea
        style={{ ...inputStyle, height: 90 }}
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />

      <label style={label}>Price</label>
      <input
        style={inputStyle}
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <label style={label}>Sale price (leave empty for none)</label>
      <input
        style={inputStyle}
        type="number"
        value={oldPrice}
        onChange={(e) => setOldPrice(e.target.value)}
      />

      <label style={label}>Tag (optional)</label>
      <input style={inputStyle} value={tag} onChange={(e) => setTag(e.target.value)} />

      <label style={label}>Category (read-only)</label>
      <div>{product.category}</div>

      <label style={label}>Main image URL</label>
      <input style={inputStyle} value={hero} onChange={(e) => setHero(e.target.value)} />
      {hero.trim() !== '' && (
        <div style={{ marginTop: 8 }}>
          <img src={hero} alt="Main image preview" width={120} height={120} style={{ objectFit: 'cover' }} />
        </div>
      )}

      <label style={label}>Gallery images</label>
      {gallery.map((url, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <input
            style={inputStyle}
            value={url}
            onChange={(e) =>
              setGallery((g) => g.map((u, j) => (j === i ? e.target.value : u)))
            }
          />{' '}
          <button type="button" className="btn-secondary" onClick={() => setGallery((g) => g.filter((_, j) => j !== i))}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={() => setGallery((g) => [...g, ''])}>
        Add image
      </button>

      <h2>Variant stock</h2>
      {sizes.length === 0 || colors.length === 0 ? (
        <p>No variants defined for this product.</p>
      ) : (
        <table style={{ marginTop: 8 }}>
          <thead>
            <tr>
              <th>Size</th>
              {colors.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sizes.map((s) => (
              <tr key={s}>
                <td style={{ fontWeight: 600 }}>{s}</td>
                {colors.map((c) => {
                  const key = `${c}|${s}`;
                  const cell = cells[key];
                  if (!cell) return <td key={key}>—</td>;
                  return (
                    <td key={key}>
                      <input
                        type="number"
                        style={{ width: 70 }}
                        value={cell.draft}
                        onChange={(e) =>
                          setCells((prev) => ({
                            ...prev,
                            [key]: { ...prev[key], draft: e.target.value },
                          }))
                        }
                        onBlur={() => void patchVariant(c, s, cell)}
                      />{' '}
                      {cell.status === 'saving' && <small>saving…</small>}
                      {cell.status === 'saved' && <small style={{ color: 'var(--color-success)' }}>saved</small>}
                      {cell.status === 'error' && (
                        <small style={{ color: 'var(--color-error)' }}>{cell.error}</small>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 24 }}>
        <button type="button" className="btn-primary" onClick={() => void saveProduct()} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>{' '}
        {saveMsg && (
          <span style={{ color: saveMsg.ok ? 'var(--color-success)' : 'var(--color-error)' }}>
            {saveMsg.text}
          </span>
        )}
      </div>
    </div>
  );
}
