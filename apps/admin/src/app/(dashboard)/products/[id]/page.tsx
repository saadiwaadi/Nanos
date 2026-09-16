'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { API_BASE } from '@/lib/api';

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

type ProductColor = {
  id: string;
  productId: string;
  name: string;
  hex: string;
  imagesJson: string;
  sortOrder: number;
};

type ColorState = {
  id: string;
  name: string;
  hex: string;
  images: string[];
  status: 'idle' | 'saving' | 'saved' | 'error';
  error: string | null;
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

  // per-color editing state (Colors section)
  const [colorRows, setColorRows] = useState<Record<string, ColorState>>({});
  const [colorOrder, setColorOrder] = useState<string[]>([]);

  // variant stock grid: key = `${color}|${size}`
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [cells, setCells] = useState<Record<string, CellState>>({});
  const [addVariantStatus, setAddVariantStatus] = useState<Record<string, string>>({});

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

      const nextColors: Record<string, ColorState> = {};
      const nextOrder: string[] = [];
      for (const c of (data as Product & { colors?: ProductColor[] }).colors ?? []) {
        let cimgs: string[] = [];
        try {
          const parsed = JSON.parse(c.imagesJson);
          if (Array.isArray(parsed)) cimgs = parsed.map(String);
        } catch {
          // leave images empty if malformed
        }
        nextColors[c.id] = {
          id: c.id,
          name: c.name,
          hex: c.hex,
          images: cimgs,
          status: 'idle',
          error: null,
        };
        nextOrder.push(c.id);
      }
      setColorOrder(nextOrder);
      setColorRows(nextColors);

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

  const addVariant = async (color: string, size: string) => {
    const key = `${color}|${size}`;
    setAddVariantStatus((s) => ({ ...s, [key]: 'adding' }));
    try {
      const res = await fetch(`${API_BASE}/admin/products/${id}/variants`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color, size, stock: 0 }),
      });
      if (res.status === 201 || res.status === 200) {
        const _v = await res.json();
        void _v;
        setCells((prev) => ({
          ...prev,
          [key]: { draft: '0', committed: 0, status: 'idle', error: null },
        }));
        setColors((prev) =>
          [...new Set([...prev, color])].sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true }),
          ),
        );
        setSizes((prev) =>
          [...new Set([...prev, size])].sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true }),
          ),
        );
        setAddVariantStatus((s) => ({ ...s, [key]: 'idle' }));
      } else {
        setAddVariantStatus((s) => ({ ...s, [key]: 'error' }));
      }
    } catch {
      setAddVariantStatus((s) => ({ ...s, [key]: 'error' }));
    }
  };

  const colorReq = async (
    cid: string,
    method: 'POST' | 'PATCH' | 'DELETE',
    body?: unknown,
  ): Promise<Response | null> => {
    try {
      return await fetch(
        method === 'POST'
          ? `${API_BASE}/admin/products/${id}/colors`
          : `${API_BASE}/admin/products/${id}/colors/${cid}`,
        {
          method,
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body),
        },
      );
    } catch {
      return null;
    }
  };

  const saveColor = async (cid: string) => {
    const c = colorRows[cid];
    if (!c) return;
    setColorRows((prev) => (prev ? { ...prev, [cid]: { ...prev[cid], status: 'saving', error: null } } : prev));
    const res = await colorReq(cid, 'PATCH', {
      name: c.name.trim(),
      hex: c.hex,
      imagesJson: JSON.stringify(c.images.filter((u) => u.trim() !== '')),
    });
    if (res && res.status === 200) {
      setColorRows((prev) =>
        prev ? { ...prev, [cid]: { ...prev[cid], status: 'saved', error: null } } : prev,
      );
      setTimeout(
        () =>
          setColorRows((prev) =>
            prev && prev[cid] && prev[cid].status === 'saved'
              ? { ...prev, [cid]: { ...prev[cid], status: 'idle' } }
              : prev,
          ),
        2000,
      );
    } else {
      setColorRows((prev) =>
        prev
          ? {
              ...prev,
              [cid]: {
                ...prev[cid],
                status: 'error',
                error: res ? `Save failed (status ${res.status})` : 'Save failed (network error)',
              },
            }
          : prev,
      );
    }
  };

  const [addingColor, setAddingColor] = useState(false);

  const addColor = async () => {
    setAddingColor(true);
    // Blank color (transparent-black placeholder hex); user edits it in place.
    const res = await colorReq('', 'POST', { name: 'New color', hex: '#111111' });
    setAddingColor(false);
    if (res && res.status === 201) {
      const created = (await res.json()) as ProductColor;
      setColorRows((prev) => ({
        ...(prev ?? {}),
        [created.id]: {
          id: created.id,
          name: created.name,
          hex: created.hex,
          images: [],
          status: 'idle',
          error: null,
        },
      }));
      setColorOrder((prev) => [...prev, created.id]);
    } else {
      alert(
        res ? `Add color failed (status ${res.status})` : 'Add color failed (network error)',
      );
    }
  };

  const deleteColor = async (cid: string) => {
    if (colorOrder.length <= 1) return; // UI guard: never fire the doomed request
    const c = colorRows[cid];
    if (!c) return;
    setColorRows((prev) => (prev ? { ...prev, [cid]: { ...prev[cid], status: 'saving', error: null } } : prev));
    const res = await colorReq(cid, 'DELETE');
    if (res && res.status === 200) {
      setColorRows((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        delete next[cid];
        return next;
      });
      setColorOrder((prev) => prev.filter((x) => x !== cid));
    } else {
      setColorRows((prev) =>
        prev
          ? {
              ...prev,
              [cid]: {
                ...prev[cid],
                status: 'error',
                error: res ? `Delete failed (status ${res.status})` : 'Delete failed (network error)',
              },
            }
          : prev,
      );
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

      <h2>Colors</h2>
      <p style={{ marginTop: -6, opacity: 0.7 }}>
        Each color can carry its own image list — the storefront PDP shows the
        selected color&apos;s images first (falling back to the product gallery).
      </p>
      {colorOrder.map((cid) => {
        const c = colorRows[cid];
        if (!c) return null;
        const update = (patch: Partial<ColorState>) =>
          setColorRows((prev) => (prev ? { ...prev, [cid]: { ...prev[cid], ...patch } } : prev));
        return (
          <div
            key={cid}
            style={{
              border: 'var(--border)',
              borderRadius: 'var(--radius)',
              padding: 12,
              marginBottom: 12,
              maxWidth: 560,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="color"
                aria-label={`Color picker for ${c.name || 'color'}`}
                value={c.hex}
                onChange={(e) => update({ hex: e.target.value })}
                style={{ width: 42, height: 32, padding: 2 }}
              />
              <input
                style={{ width: 180 }}
                value={c.name}
                placeholder="Color name"
                onChange={(e) => update({ name: e.target.value })}
              />
              <span style={{ fontFamily: 'monospace', fontSize: 12, opacity: 0.6 }}>{c.hex}</span>
              <span style={{ flex: 1 }} />
              <button
                type="button"
                className="btn-secondary"
                disabled={colorOrder.length <= 1 || c.status === 'saving'}
                title={colorOrder.length <= 1 ? 'A product must keep at least one color' : undefined}
                onClick={() => void deleteColor(cid)}
              >
                Delete
              </button>
            </div>
            {c.images.map((url, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  style={{ flex: 1 }}
                  value={url}
                  placeholder="Image URL"
                  onChange={(e) =>
                    update({ images: c.images.map((u, j) => (j === i ? e.target.value : u)) })
                  }
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => update({ images: c.images.filter((_, j) => j !== i) })}
                >
                  Remove
                </button>
              </div>
            ))}
            <div style={{ marginTop: 8 }}>
              <button type="button" className="btn-secondary" onClick={() => update({ images: [...c.images, ''] })}>
                Add image URL
              </button>
            </div>
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                className="btn-primary"
                disabled={c.status === 'saving' || c.name.trim() === ''}
                onClick={() => void saveColor(cid)}
              >
                {c.status === 'saving' ? 'Saving…' : 'Save color'}
              </button>{' '}
              {c.status === 'saved' && <span style={{ color: 'var(--color-success)' }}>Saved</span>}
              {c.status === 'error' && <span style={{ color: 'var(--color-error)' }}>{c.error}</span>}
            </div>
          </div>
        );
      })}
      <button
        type="button"
        className="btn-secondary"
        disabled={addingColor}
        onClick={() => void addColor()}
      >
        {addingColor ? 'Adding…' : 'Add color'}
      </button>

      <h2 style={{ marginTop: 32 }}>Variant stock</h2>
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
                  if (!cell) {
                    return (
                      <td key={key}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ fontSize: 11, padding: '2px 8px' }}
                          onClick={() => void addVariant(c, s)}
                        >
                          + Add
                        </button>
                        {addVariantStatus[key] === 'adding' && <small> adding…</small>}
                        {addVariantStatus[key] === 'error' && (
                          <small style={{ color: 'var(--color-error)' }}> failed</small>
                        )}
                      </td>
                    );
                  }
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
