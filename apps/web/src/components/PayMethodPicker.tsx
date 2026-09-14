"use client";

import { useState } from "react";

/** Prototype selectPayment(): radio selection + reveal card fields. */
export function PayMethodPicker() {
  const [method, setMethod] = useState<"cod" | "card" | "easypaisa">("cod");

  const options = [
    { value: "cod", label: "Cash on Delivery", sub: "Pay when it arrives" },
    { value: "card", label: "Debit / Credit Card", sub: "Visa, Mastercard" },
    { value: "easypaisa", label: "EasyPaisa / JazzCash", sub: "Mobile wallet" },
  ] as const;

  return (
    <div className="form-section">
      <h3>Payment Method</h3>
      <div className="payment-options">
        {options.map((o) => (
          <label
            key={o.value}
            className={`pay-opt ${method === o.value ? "selected" : ""}`}
            onClick={() => setMethod(o.value)}
          >
            <input
              type="radio"
              name="payment"
              value={o.value}
              checked={method === o.value}
              onChange={() => setMethod(o.value)}
            />
            <span className="pay-label">{o.label}</span>
            <span className="pay-sub">{o.sub}</span>
          </label>
        ))}
      </div>
      {method === "card" && (
        <div style={{ marginTop: 16 }}>
          <div className="form-row">
            <div className="form-group full">
              <label htmlFor="card-number">Card Number</label>
              <input type="text" id="card-number" placeholder="4242 4242 4242 4242" maxLength={19} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="card-expiry">Expiry</label>
              <input type="text" id="card-expiry" placeholder="MM/YY" maxLength={5} />
            </div>
            <div className="form-group">
              <label htmlFor="card-cvc">CVC</label>
              <input type="text" id="card-cvc" placeholder="123" maxLength={3} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
