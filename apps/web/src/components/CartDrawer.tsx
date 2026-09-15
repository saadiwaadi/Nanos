"use client";

import { useEffect, useRef, useCallback } from "react";
import { useCart, fmtPrice } from "@/lib/cart";
import { ProductCodeTag } from "./ProductCodeTag";

const CART_DRAWER_WIDTH = 400;
const MOBILE_BREAKPOINT = 640;

function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/** Small cross button that morphs from the cart icon's style — used in the drawer header. */
function DrawerCloseButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="cart-drawer-close"
      aria-label="Close cart"
      onClick={onClick}
    >
      <XIcon />
    </button>
  );
}

function QtyStepper({
  qty,
  onDecrement,
  onIncrement,
}: {
  qty: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <div className="cart-qty-stepper">
      <button
        type="button"
        className="cart-qty-btn"
        aria-label="Decrease quantity"
        onClick={onDecrement}
        disabled={qty <= 1}
      >
        −
      </button>
      <span className="cart-qty-val" aria-label={`Quantity: ${qty}`}>
        {qty}
      </span>
      <button
        type="button"
        className="cart-qty-btn"
        aria-label="Increase quantity"
        onClick={onIncrement}
      >
        +
      </button>
    </div>
  );
}

function CartItemRow({
  item,
  onUpdateQty,
  onRemove,
}: {
  item: ReturnType<typeof useCart>["items"][0];
  onUpdateQty: (delta: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="cart-item">
      <div className="cart-item-img">
        {item.img ? (
          <img src={item.img} alt={item.name} />
        ) : (
          <div className="cart-item-img-slot" />
        )}
        <ProductCodeTag productId={item.productId} />
      </div>

      <div className="cart-item-info">
        <p className="cart-item-name">{item.name}</p>
        <p className="cart-item-meta">
          {item.color} · {item.size}
        </p>
        <p className="cart-item-price">{fmtPrice(item.price)}</p>

        <div className="cart-item-actions">
          <QtyStepper
            qty={item.qty}
            onDecrement={() => onUpdateQty(-1)}
            onIncrement={() => onUpdateQty(1)}
          />
          <button
            type="button"
            className="cart-item-remove"
            aria-label={`Remove ${item.name} from cart`}
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="cart-empty">
      <div className="cart-empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      </div>
      <h3>Your cart is empty</h3>
      <p>Add some crocs or trousers to get started.</p>
      <button
        type="button"
        className="cart-empty-shop-btn"
        onClick={() => {}}
        aria-label="Go to shop"
      >
        Shop now
      </button>
    </div>
  );
}

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const cart = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // focus management
  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement | null;
      // move focus into the drawer after the transition starts
      const t = setTimeout(() => {
        const first = drawerRef.current?.querySelector<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])',
        );
        first?.focus();
      }, 50);
      return () => clearTimeout(t);
    } else {
      previousActiveElement.current?.focus();
    }
  }, [open]);

  // focus trap (Tab only — Escape is handled centrally by ChromeShell)
  useEffect(() => {
    if (!open) return;
    const el = drawerRef.current;
    if (!el) return;

    const focusable = el.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [open]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  return (
    <>
      {/* backdrop */}
      <div
        className={`cart-drawer-backdrop ${open ? "cart-drawer-backdrop-open" : ""}`}
        aria-hidden="true"
        onClick={handleBackdropClick}
      />

      {/* drawer panel */}
      <div
        ref={drawerRef}
        className={`cart-drawer ${open ? "cart-drawer-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        tabIndex={-1}
      >
        {/* header */}
        <div className="cart-drawer-header">
          <h2 className="cart-drawer-title">Your Cart</h2>
          <DrawerCloseButton onClick={onClose} />
        </div>

        {/* scrollable items */}
        <div className="cart-drawer-items">
          {cart.items.length === 0 ? (
            <EmptyState />
          ) : (
            cart.items.map((item) => (
              <CartItemRow
                key={`${item.productId}|${item.color}|${item.size}`}
                item={item}
                onUpdateQty={(delta) =>
                  cart.updateQty(item.productId, item.color, item.size, delta)
                }
                onRemove={() =>
                  cart.removeItem(item.productId, item.color, item.size)
                }
              />
            ))
          )}
        </div>

        {/* pinned footer */}
        <div className="cart-drawer-footer">
          <div className="cart-drawer-subtotal">
            <span>Subtotal</span>
            <span className="cart-drawer-subtotal-amount">
              {fmtPrice(cart.subtotal)}
            </span>
          </div>

          {cart.discount > 0 && (
            <div className="cart-drawer-discount">
              <span>Discount ({cart.promo})</span>
              <span>−{fmtPrice(cart.discount)}</span>
            </div>
          )}

          {cart.shipping > 0 && cart.items.length > 0 && (
            <div className="cart-drawer-shipping">
              <span>Shipping</span>
              <span>{fmtPrice(cart.shipping)}</span>
            </div>
          )}

          <button
            type="button"
            className="cart-drawer-checkout"
            onClick={() => {}}
          >
            Continue to Checkout
          </button>
        </div>
      </div>
    </>
  );
}
