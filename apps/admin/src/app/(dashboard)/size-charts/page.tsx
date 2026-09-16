'use client';

import { useCallback, useEffect, useState } from 'react';

import { API_BASE } from '@/lib/api';

type SizeRow = { size: string };

type RowState = {
  draft: string;
  committed: string;
  status: 'idle' | 'saving' | 'saved' | 'error';
  error: string | null;
};

const FALLBACK_CATEGORIES = ['crocs', 'trousers'];

export default function SizeChartsPage() {
  const [categories, setCategories] = useState<string[] | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, RowState[]>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchChart = useCallback(async (category: string): Promise<SizeRow[] | null> => {
    const res = await fetch(`${API_BASE}/admin/products/size-charts/${encodeURIComponent(category)}`, {
      credentials: 'include',
    });
    if (res.status === 401) {
      window.location.href = '/';
      return null;
    }
    if (res.status !== 200) {
      throw new Error(`Failed to load size chart for ${category} (status ${res.status})`);
    }
    const chart = await res.json();
    // GET returns 200 with a null body for categories that have no chart yet.
    if (!chart || typeof chart.rowsJson !== 'string') return [];
    const parsed: unknown = JSON.parse(chart.rowsJson);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((r) => ({ size: typeof (r as SizeRow)?.size === 'string' ? (r as SizeRow).size : '' }))
      .filter((r) => r.size.trim() !== '');
  }, []);

  useEffect(() => {
    async function load() {
      try {
        // Category list mirrors the store's real product categories
        // (same source the Products/Settings pages use). Falls back to the
        // seeded defaults if the settings endpoint is unavailable.
        let cats: string[] = FALLBACK_CATEGORIES;
        const res = await fetch(`${API_BASE}/admin/settings`, { credentials: 'include' });
        if (res.status === 401) {
          window.location.href = '/';
          return;
        }
        if (res.status === 200) {
          const settings: { category: string }[] = await res.json();
          if (Array.isArray(settings) && settings.length > 0) {
            cats = settings.map((s) => s.category);
          }
        }

        const nextRows: Record<string, RowState[]> = {};
        for (const cat of cats) {
          const sizeRows = await fetchChart(cat);
          if (sizeRows === null) return; // redirected to login
          nextRows[cat] = sizeRows.map((r) => ({
            draft: r.size,
            committed: r.size,
            status: 'idle',
            error: null,
          }));
        }
        setCategories(cats);
        setRows(nextRows);
        setActiveCategory((prev) => (prev && cats.includes(prev) ? prev : cats[0] ?? null));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load size charts');
      }
    }
    void load();
  }, [fetchChart]);

  const activeRows = activeCategory != null ? (rows[activeCategory] ?? []) : [];

  const updateRow = (index: number, patch: Partial<RowState>) => {
    if (activeCategory == null) return;
    setRows((prev) => ({
      ...prev,
      [activeCategory]: (prev[activeCategory] ?? []).map((row, i) =>
        i === index ? { ...row, ...patch } : row,
      ),
    }));
  };

  const addRow = () => {
    if (activeCategory == null) return;
    setRows((prev) => ({
      ...prev,
      [activeCategory]: [
        ...(prev[activeCategory] ?? []),
        { draft: '', committed: '', status: 'idle', error: null },
      ],
    }));
  };

  const removeRow = (index: number) => {
    if (activeCategory == null) return;
    setRows((prev) => ({
      ...prev,
      [activeCategory]: (prev[activeCategory] ?? []).filter((_, i) => i !== index),
    }));
  };

  const saveChart = async () => {
    if (activeCategory == null || saving) return;
    setSaving(true);
    setSaveMsg(null);

    const cleaned = activeRows
      .map((r) => r.draft.trim())
      .filter((s) => s !== '');

    if (cleaned.length !== [...new Set(cleaned)].length) {
      setSaveMsg({ ok: false, text: 'Duplicate sizes found — each size must be unique.' });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/admin/products/size-charts/${encodeURIComponent(activeCategory)}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rowsJson: JSON.stringify(cleaned.map((size) => ({ size }))) }),
        },
      );
      if (res.status === 401) {
        window.location.href = '/';
        return;
      }
      if (res.status === 200 || res.status === 201) {
        // Re-fetch from the server to confirm persistence before showing success.
        const confirmed = await fetchChart(activeCategory);
        if (confirmed === null) return; // redirected to login
        setRows((prev) => ({
          ...prev,
          [activeCategory]: confirmed.map((r) => ({
            draft: r.size,
            committed: r.size,
            status: 'idle',
            error: null,
          })),
        }));
        setSaveMsg({ ok: true, text: `Saved ${confirmed.length} rows for ${activeCategory}.` });
      } else {
        setSaveMsg({ ok: false, text: `Save failed (status ${res.status})` });
      }
    } catch {
      setSaveMsg({ ok: false, text: 'Save failed (network error)' });
    } finally {
      setSaving(false);
    }
  };

  if (error) return <div style={{ color: 'var(--color-error)' }}>{error}</div>;
  if (categories == null) return <div>Loading size charts...</div>;

  const dirty = activeRows.some((r) => r.draft.trim() !== r.committed);

  return (
    <div style={{ maxWidth: 640 }}>
      <h1>Size Charts</h1>
      <p style={{ opacity: 0.7, marginTop: -6 }}>
        Size options offered per product category. The storefront PDP reads these
        rows (in order) as the size selector for that category.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={cat === activeCategory ? 'btn-primary' : 'btn-secondary'}
            onClick={() => {
              setActiveCategory(cat);
              setSaveMsg(null);
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {activeCategory == null ? (
        <p>No categories available.</p>
      ) : (
        <>
          <h2 style={{ textTransform: 'capitalize' }}>{activeCategory}</h2>
          {activeRows.length === 0 ? (
            <p style={{ opacity: 0.7 }}>No size rows yet — add the first one below.</p>
          ) : (
            <table style={{ maxWidth: 420 }}>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th>Size</th>
                  <th style={{ width: 90 }}></th>
                </tr>
              </thead>
              <tbody>
                {activeRows.map((row, i) => (
                  <tr key={i}>
                    <td style={{ opacity: 0.5 }}>{i + 1}</td>
                    <td>
                      <input
                        type="text"
                        aria-label={`Size row ${i + 1}`}
                        value={row.draft}
                        onChange={(e) => updateRow(i, { draft: e.target.value, status: 'idle', error: null })}
                        style={{ width: 180 }}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => removeRow(i)}
                        title="Remove row"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="button" className="btn-secondary" onClick={addRow}>
              + Add size row
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => void saveChart()}
              disabled={saving}
            >
              {saving ? 'Saving…' : `Save ${activeCategory} chart`}
            </button>
            {saveMsg && (
              <span style={{ color: saveMsg.ok ? 'var(--color-success)' : 'var(--color-error)' }}>
                {saveMsg.text}
              </span>
            )}
            {dirty && !saveMsg && <span style={{ opacity: 0.6, fontSize: 13 }}>Unsaved changes</span>}
          </div>
        </>
      )}
    </div>
  );
}
