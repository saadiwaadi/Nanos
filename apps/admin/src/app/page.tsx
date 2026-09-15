"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const API = "http://localhost:4000";

export default function AdminPage() {
  const [status, setStatus] = useState<"checking" | "authed" | "anon">("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch(`${API}/auth/admin/me`, {
        credentials: "include",
      });
      setStatus(res.ok ? "authed" : "anon");
    } catch {
      setStatus("anon");
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/auth/admin/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.status === 201) {
        setEmail("");
        setPassword("");
        await checkSession();
      } else {
        setError(`Login failed (HTTP ${res.status})`);
      }
    } catch {
      setError("Login request failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "checking") {
    return <p>Checking session…</p>;
  }

  if (status === "authed") {
    return (
      <div>
        <p>Admin session active</p>
        <Link href="/products">Products</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Admin login</h1>
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <br />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <br />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
