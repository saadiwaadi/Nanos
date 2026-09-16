export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function adminApiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    let errorText = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      errorText = data.message || data.error || errorText;
    } catch {}
    throw new Error(Array.isArray(errorText) ? errorText.join(', ') : errorText);
  }

  return res.json();
}
