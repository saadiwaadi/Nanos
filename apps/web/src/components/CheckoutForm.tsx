"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PayMethodPicker } from "@/components/PayMethodPicker";
import { useCart, fmtPrice } from "@/lib/cart";
import { getToken, saveSession } from "@/lib/auth";
import { API_BASE } from "@/lib/api";
import { trackInitiateCheckout } from "@/lib/pixel";

export function CheckoutForm() {
  const router = useRouter();
  const cart = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [promoInput, setPromoInput] = useState("");
  const [promoMsg, setPromoMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const token = getToken();
    setIsLoggedIn(Boolean(token));

    if (cart.items.length > 0) {
      trackInitiateCheckout(
        cart.items.map((i) => ({
          productId: i.productId,
          price: i.price,
          quantity: i.qty,
        })),
        cart.total,
        "PKR",
      );
    }
  }, []);

  const phoneDigits = (phone.match(/\d/g) || []).length;
  const isPhoneValid = phoneDigits >= 10;
  const isAddressValid = address.trim().length >= 5;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isNameValid = name.trim().length >= 2;
  const isCityValid = city.trim().length > 0;
  const isPostalValid = postal.trim().length >= 3;
  const isPasswordValid = !createAccount || password.length >= 8;

  const isFormValid =
    isNameValid &&
    isPhoneValid &&
    isEmailValid &&
    isAddressValid &&
    isCityValid &&
    isPostalValid &&
    isPasswordValid &&
    cart.items.length > 0;

  if (cart.items.length === 0) {
    return (
      <div className="page">
        <div className="wrap">
          <div className="empty-state">
            <h2>Your cart is empty</h2>
            <p>Add something before checking out.</p>
            <Link href="/" className="btn btn-primary">
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!isFormValid) {
      setErrorMsg("Please fill out all required fields correctly before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      let token = getToken();

      if (!token && createAccount) {
        if (!password || password.length < 8) {
          setErrorMsg("Password must be at least 8 characters long.");
          setIsSubmitting(false);
          return;
        }

        const regRes = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const regData = await regRes.json();
        if (!regRes.ok) {
          const msg = regData?.message || "Registration failed";
          setErrorMsg(Array.isArray(msg) ? msg.join(", ") : String(msg));
          setIsSubmitting(false);
          return;
        }

        token = regData.accessToken;
        saveSession(regData.accessToken, regData.user);
        setIsLoggedIn(true);
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const orderPayload = {
        items: cart.items.map((i) => ({
          productId: i.productId,
          color: i.color,
          size: i.size,
          qty: i.qty,
        })),
        shippingInfo: { name, phone, email, address, city, postal },
        promoCode: cart.promo || undefined,
        guestEmail: token ? undefined : email,
        guestName: token ? undefined : name,
      };

      const orderRes = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(orderPayload),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        const msg = orderData?.message || "Failed to place order";
        setErrorMsg(Array.isArray(msg) ? msg.join(", ") : String(msg));
        setIsSubmitting(false);
        return;
      }

      cart.clear();

      if (token) {
        router.push(`/confirmation/${orderData.id}`);
      } else {
        router.push(
          `/confirmation/${orderData.id}?email=${encodeURIComponent(email)}`,
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
      setIsSubmitting(false);
    }
  }

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  return (
    <div className="page">
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="sep">/</span>
        <Link href="/cart">Cart</Link>
        <span className="sep">/</span>
        <span className="current">Checkout</span>
      </div>

      <div
        className="category-hero"
        style={{ borderBottom: "none", paddingBottom: 0 }}
      >
        <h1>Checkout</h1>
      </div>

      <div className="checkout-steps">
        <div className="checkout-step done">1. Cart</div>
        <div className="checkout-step active">2. Details &amp; Payment</div>
        <div className="checkout-step">3. Confirmation</div>
      </div>

      <div className="checkout-layout">
        <div>
          <form id="checkout-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Shipping Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ship-name">Full Name</label>
                  <input
                    type="text"
                    id="ship-name"
                    required
                    placeholder="Ali Raza"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => markTouched("name")}
                  />
                  {touched.name && !isNameValid && (
                    <span style={{ color: "#c0392b", fontSize: 12, marginTop: 4, display: "block" }}>
                      Please enter your full name
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="ship-phone">Phone Number</label>
                  <input
                    type="tel"
                    id="ship-phone"
                    required
                    placeholder="03XX-XXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => markTouched("phone")}
                  />
                  {touched.phone && !isPhoneValid && (
                    <span style={{ color: "#c0392b", fontSize: 12, marginTop: 4, display: "block" }}>
                      Phone number must contain at least 10 digits
                    </span>
                  )}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group full">
                  <label htmlFor="ship-email">Email</label>
                  <input
                    type="email"
                    id="ship-email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => markTouched("email")}
                  />
                  {touched.email && !isEmailValid && (
                    <span style={{ color: "#c0392b", fontSize: 12, marginTop: 4, display: "block" }}>
                      Please enter a valid email address
                    </span>
                  )}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group full">
                  <label htmlFor="ship-address">Address</label>
                  <input
                    type="text"
                    id="ship-address"
                    required
                    placeholder="House #, Street, Area"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onBlur={() => markTouched("address")}
                  />
                  {touched.address && !isAddressValid && (
                    <span style={{ color: "#c0392b", fontSize: 12, marginTop: 4, display: "block" }}>
                      Address must be at least 5 characters long
                    </span>
                  )}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ship-city">City</label>
                  <select
                    id="ship-city"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onBlur={() => markTouched("city")}
                  >
                    <option value="">Select city</option>
                    <option>Lahore</option>
                    <option>Karachi</option>
                    <option>Islamabad</option>
                    <option>Faisalabad</option>
                    <option>Rawalpindi</option>
                    <option>Multan</option>
                  </select>
                  {touched.city && !isCityValid && (
                    <span style={{ color: "#c0392b", fontSize: 12, marginTop: 4, display: "block" }}>
                      Please select a city
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="ship-postal">Postal Code</label>
                  <input
                    type="text"
                    id="ship-postal"
                    required
                    placeholder="54000"
                    value={postal}
                    onChange={(e) => setPostal(e.target.value)}
                    onBlur={() => markTouched("postal")}
                  />
                  {touched.postal && !isPostalValid && (
                    <span style={{ color: "#c0392b", fontSize: 12, marginTop: 4, display: "block" }}>
                      Please enter a valid postal code
                    </span>
                  )}
                </div>
              </div>

              {!isLoggedIn && (
                <div
                  style={{
                    marginTop: 20,
                    paddingTop: 16,
                    borderTop: "1px solid #eee",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      fontWeight: 500,
                      fontSize: 14,
                    }}
                  >
                    <input
                      type="checkbox"
                      id="create-account-checkbox"
                      checked={createAccount}
                      onChange={(e) => setCreateAccount(e.target.checked)}
                    />
                    Create an account for faster checkout next time
                  </label>

                  {createAccount && (
                    <div className="form-row" style={{ marginTop: 12 }}>
                      <div className="form-group full">
                        <label htmlFor="account-password">
                          Account Password
                        </label>
                        <input
                          type="password"
                          id="account-password"
                          required={createAccount}
                          minLength={8}
                          placeholder="Min. 8 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        {createAccount && password.length > 0 && password.length < 8 && (
                          <span style={{ color: "#c0392b", fontSize: 12, marginTop: 4, display: "block" }}>
                            Password must be at least 8 characters long
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <PayMethodPicker />
          </form>
        </div>

        <div>
          <div className="summary-box">
            <h3>Order Summary</h3>
            {cart.items.map((item) => (
              <div
                key={`${item.productId}|${item.color}|${item.size}`}
                className="order-summary-mini"
              >
                <span>
                  {item.name} × {item.qty}
                  <span className="mini-meta">
                    {item.color} · {item.size}
                  </span>
                </span>
                <span>{fmtPrice(item.price * item.qty)}</span>
              </div>
            ))}
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{fmtPrice(cart.subtotal)}</span>
            </div>
            {cart.discount > 0 && (
              <div className="summary-row">
                <span>Promo ({cart.promo})</span>
                <span>−{fmtPrice(cart.discount)}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Shipping</span>
              <span>
                {cart.shipping === 0 ? "Free" : fmtPrice(cart.shipping)}
              </span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>{fmtPrice(cart.total)}</span>
            </div>

            <div className="promo-row" style={{ marginTop: 14 }}>
              <input
                type="text"
                placeholder="Promo code"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  const res = cart.applyPromo(promoInput);
                  setPromoMsg({ ok: res.ok, text: res.message });
                  if (res.ok) setPromoInput("");
                }}
              >
                Apply
              </button>
            </div>
            {promoMsg && (
              <div
                style={{
                  fontSize: 12.5,
                  marginTop: 6,
                  color: promoMsg.ok ? "#5a8f00" : "#c0392b",
                }}
              >
                {promoMsg.text}
              </div>
            )}

            {errorMsg && (
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "#fdf2f2",
                  color: "#c0392b",
                  borderRadius: 6,
                  marginTop: 14,
                  fontSize: 13.5,
                }}
              >
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              form="checkout-form"
              disabled={!isFormValid || isSubmitting}
              className="btn btn-primary btn-block"
              style={{
                marginTop: 18,
                opacity: !isFormValid || isSubmitting ? 0.6 : 1,
                cursor: !isFormValid || isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Placing Order..." : `Place Order — ${fmtPrice(cart.total)}`}
            </button>
            <Link
              href="/cart"
              className="btn btn-outline btn-block"
              style={{ marginTop: 10 }}
            >
              ← Back to Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
