import Link from "next/link";

// Brand icons were removed from lucide-react; these inline SVGs keep the
// lucide stroke look. Size comes from the .footer-social svg CSS rule.
const socialIcons = [
  {
    label: "Instagram (placeholder)",
    path: (
      <>
        <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <line x1="17.2" y1="6.8" x2="17.2" y2="6.8" strokeWidth="2.6" />
      </>
    ),
  },
  {
    label: "Facebook (placeholder)",
    path: <path d="M15.5 3.5h-2.6a3.4 3.4 0 0 0-3.4 3.4v2.4H6.8v3.2h2.7v8h3.3v-8h2.7l.5-3.2h-3.2V7.2a.9.9 0 0 1 .9-.9h1.8z" />,
  },
  {
    label: "X / Twitter (placeholder)",
    path: (
      <>
        <path d="M4 4l16 16" />
        <path d="M20 4L4 20" />
      </>
    ),
  },
];

/**
 * Site-wide footer (dummy content).
 * Styles come from the ported prototype CSS: .site-footer / .footer-grid /
 * .footer-brand / .footer-col / .newsletter-form / .footer-bottom.
 * Contact details are placeholders until a real business profile exists.
 */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="logo" aria-label="nanos.pk home">
              <img
                src="https://res.cloudinary.com/tp1vyxi3/image/upload/v1789301766/ChatGPT_Image_Sep_13__2026__05_15_23_AM-removebg-preview.png"
                alt="nanos.pk"
                className="logo-img"
                width={120}
                height={32}
              />
            </Link>
            <p>
              Keep it simple. Wear it your way. Crocs &amp; trousers for your
              everyday rotation — designed in Karachi, shipped across Pakistan.
            </p>
          </div>

          <div className="footer-col">
            <h4>Shop</h4>
            <ul>
              <li>
                <Link href="/shop">Shop All</Link>
              </li>
              <li>
                <Link href="/crocs">Crocs</Link>
              </li>
              <li>
                <Link href="/trousers">Trousers</Link>
              </li>
              <li>
                <Link href="/sale">Sale</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Contact</h4>
            <ul>
              <li>
                <a href="mailto:support@nanos.pk">support@nanos.pk</a>
              </li>
              <li>
                <a href="tel:+923000000000">+92 300 0000000</a>
              </li>
              <li>
                <span style={{ color: "#bbb", fontSize: "13.5px" }}>
                  Dummy address — Karachi, Pakistan
                </span>
              </li>
              <li>
                <span style={{ color: "#777", fontSize: "12px" }}>
                  Mon–Sat, 10am–8pm (placeholder hours)
                </span>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Stay in the loop</h4>
            <ul>
              <li>
                <span style={{ color: "#bbb", fontSize: "13.5px" }}>
                  New drops &amp; restocks, straight to your inbox.
                </span>
              </li>
            </ul>
            <form className="newsletter-form" aria-label="Newsletter signup (dummy)">
              <input
                type="email"
                name="email"
                placeholder="Your email"
                aria-label="Email address"
              />
              <button type="button">Subscribe</button>
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 nanos.pk — All rights reserved. (dummy)</span>
          <div className="footer-social">
            {socialIcons.map((icon) => (
              <a key={icon.label} href="#" aria-label={icon.label}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {icon.path}
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
