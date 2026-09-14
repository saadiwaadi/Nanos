import Link from "next/link";

export const metadata = { title: "Account — nanos.pk" };

export default function AccountPage() {
  return (
    <div className="page">
      <div className="wrap">
        <div className="auth-wrap">
          <div className="auth-card">
            <Link href="/login" className="auth-tab active">Login</Link>
            <Link href="/account" className="auth-tab">Register</Link>
            <div style={{ marginTop: 24, textAlign: "center", color: "#777", fontSize: 14 }}>
              Account panel — login or register to view orders.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
