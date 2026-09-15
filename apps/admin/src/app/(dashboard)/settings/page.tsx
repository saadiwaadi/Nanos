'use client';

import { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:4000';

type CategorySettings = {
  category: string;
  lowStockThreshold: number;
};

type RowState = {
  draft: string;
  committed: number;
  status: 'idle' | 'saving' | 'saved' | 'error';
  error: string | null;
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function SettingsPage() {
  const [rows, setRows] = useState<Record<string, RowState> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`${API_BASE}/admin/settings`, { credentials: 'include' });
      if (res.status !== 200) {
        setLoadError(`Failed to load settings (status ${res.status})`);
        return;
      }
      const data: CategorySettings[] = await res.json();
      const next: Record<string, RowState> = {};
      for (const row of data) {
        next[row.category] = {
          draft: String(row.lowStockThreshold),
          committed: row.lowStockThreshold,
          status: 'idle',
          error: null,
        };
      }
      setRows(next);
    }
    load();
  }, []);

  const save = async (category: string) => {
    setRows((prev) => {
      if (!prev) return prev;
      const row = prev[category];
      return { ...prev, [category]: { ...row, status: 'saving', error: null } };
    });
    const row = rows![category];
    const parsed = Number(row.draft);
    if (!Number.isInteger(parsed) || parsed < 0) {
      setRows((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [category]: { ...prev[category], status: 'error', error: 'Must be a whole number ≥ 0' },
        };
      });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/settings/${encodeURIComponent(category)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lowStockThreshold: parsed }),
      });
      if (res.status === 200) {
        const updated: CategorySettings = await res.json();
        setRows((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            [category]: {
              draft: String(updated.lowStockThreshold),
              committed: updated.lowStockThreshold,
              status: 'saved',
              error: null,
            },
          };
        });
        setTimeout(() => {
          setRows((prev) =>
            prev && prev[category] && prev[category].status === 'saved'
              ? { ...prev, [category]: { ...prev[category], status: 'idle' } }
              : prev,
          );
        }, 2000);
      } else {
        setRows((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            [category]: { ...prev[category], status: 'error', error: `Save failed (status ${res.status})` },
          };
        });
      }
    } catch {
      setRows((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [category]: { ...prev[category], status: 'error', error: 'Save failed (network error)' },
        };
      });
    }
  };

  if (loadError) return <div style={{ color: 'var(--color-error)' }}>{loadError}</div>;
  if (!rows) return <div>Loading...</div>;

  const categories = Object.keys(rows);

  return (
    <div>
      <h1>Settings</h1>
      {categories.length === 0 && <p>No category settings found.</p>}
      {categories.map((category) => {
        const row = rows[category];
        return (
          <div key={category} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <label htmlFor={`threshold-${category}`} style={{ width: 120, fontWeight: 600 }}>
              {capitalize(category)}
            </label>
            <input
              id={`threshold-${category}`}
              type="number"
              style={{ width: 100 }}
              value={row.draft}
              onChange={(e) =>
                setRows((prev) =>
                  prev
                    ? { ...prev, [category]: { ...prev[category], draft: e.target.value } }
                    : prev,
                )
              }
            />
            <button
              type="button"
              className="btn-primary"
              onClick={() => void save(category)}
              disabled={row.status === 'saving'}
            >
              {row.status === 'saving' ? 'Saving…' : 'Save'}
            </button>
            {row.status === 'saved' && <span style={{ color: 'var(--color-success)' }}>Saved</span>}
            {row.status === 'error' && (
              <span style={{ color: 'var(--color-error)' }}>{row.error}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
