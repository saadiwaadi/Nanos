"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/brand";

export function SideNav({
  open,
  onNavigate,
}: {
  open: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const links = [
    { key: "home", label: "Home", target: "" },
    { key: "cart", label: "Cart", target: "cart" },
  ];

  return (
    <nav className={`side-nav ${open ? "open" : ""}`}>
      {links.map((link) => {
        const href = `/${link.target}`;
        const active = pathname === href;
        return (
          <Link
            key={link.label}
            href={href}
            className={`side-link ${active ? "active" : ""}`}
            onClick={onNavigate}
          >
            {link.label}
            <span className="side-arrow">→</span>
          </Link>
        );
      })}
    </nav>
  );
}
