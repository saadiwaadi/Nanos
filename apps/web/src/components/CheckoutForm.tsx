"use client";

import Link from "next/link";
import { PlaceholderSlot } from "@/components/PlaceholderSlot";
import { PayMethodPicker } from "@/components/PayMethodPicker";
import { useCart, fmtPrice } from "@/lib/cart";

/**
 * CHECKOUT — prototype renderCheckout() markup (client island).
 * No order API yet, so: no fake totals, no fake cart lines. The full shipping
 * + payment form renders exactly like the prototype; the order summary box is
 * a labeled slot. "Place Order" is wired client-side below but shows an
 * honest "checkout API not connected yet" notice until OrdersModule lands.
 */
export function CheckoutForm() {
  const cart = useCart();

  // Guard: nothing to check out — send them back to the cart.
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

  return (
    <div className="page">
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="sep">/</span>
        <Link href="/cart">Cart</Link>
        <span className="sep">/</span>
        <span className="current">Checkout</span>
      </div>

      <div className="category-hero" style={{ borderBottom: "none", paddingBottom: 0 }}>
        <h1>Checkout</h1>
      </div>

      <div className="checkout-steps">
        <div className="checkout-step done">1. Cart</div>
        <div className="checkout-step active">2. Details &amp; Payment</div>
        <div className="checkout-step">3. Confirmation</div>
      </div>

      <div className="checkout-layout">
        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // SLOT: ORDER-CREATE — POST /orders (OrdersModule).
              alert("Checkout API not connected yet — see SLOT: ORDER-CREATE in the page source.");
            }}
          >
            <div className="form-section">
              <h3>Shipping Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ship-name">Full Name</label>
                  <input type="text" id="ship-name" required placeholder="Ali Raza" />
                  <span className="error-text">Please enter your name</span>
                </div>
                <div className="form-group">
                  <label htmlFor="ship-phone">Phone Number</label>
                  <input type="tel" id="ship-phone" required placeholder="03XX-XXXXXXX" />
                  <span className="error-text">Please enter a valid phone number</span>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group full">
                  <label htmlFor="ship-email">Email</label>
                  <input type="email" id="ship-email" required placeholder="you@example.com" />
                  <span className="error-text">Please enter a valid email</span>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group full">
                  <label htmlFor="ship-address">Address</label>
                  <input type="text" id="ship-address" required placeholder="House #, Street, Area" />
                  <span className="error-text">Please enter your address</span>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ship-city">City</label>
                  <select id="ship-city" required defaultValue="">
                    <option value="">Select city</option>
                    <option>Lahore</option>
                    <option>Karachi</option>
                    <option>Islamabad</option>
                    <option>Faisalabad</option>
                    <option>Rawalpindi</option>
                    <option>Multan</option>
                  </select>
                  <span className="error-text">Please select a city</span>
                </div>
                <div className="form-group">
                  <label htmlFor="ship-postal">Postal Code</label>
                  <input type="text" id="ship-postal" required placeholder="54000" />
                  <span className="error-text">Please enter a postal code</span>
                </div>
              </div>
            </div>

            <PayMethodPicker />
          </form>
        </div>

        <div>
          {/* Live summary from the client cart store. When OrdersModule lands,
              POST /orders receives these exact items + totals. */}
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
              <span>{cart.shipping === 0 ? "Free" : fmtPrice(cart.shipping)}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>{fmtPrice(cart.total)}</span>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-block"
              style={{ marginTop: 18 }}
              onClick={() => {
                // SLOT: ORDER-CREATE — POST /orders (OrdersModule) will take
                // cart.items + cart.total + this form's shipping details.
                alert(
                  "Checkout API not connected yet — see SLOT: ORDER-CREATE in the page source.",
                );
              }}
            >
              Place Order — {fmtPrice(cart.total)}
            </button>
            <Link
              href="/cart"
              className="btn btn-outline btn-block"
              style={{ marginTop: 10 }}
            >
              ← Back to Cart
            </Link>
          </div>

          {/* SLOT: ORDER-CREATE — POST /orders (OrdersModule). On success the
              API returns the order; navigate to /confirmation/[id]. */}
          <PlaceholderSlot
            name="ORDER-CREATE"
            feeds="POST /orders (OrdersModule)"
            note="Form + totals are complete; submit shows a notice until this endpoint exists."
          />
        </div>
      </div>
    </div>
  );
}
