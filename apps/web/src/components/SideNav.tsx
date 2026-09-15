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
  const categories = [
    { key: "crocs", label: "Crocs", target: "crocs" },
    { key: "trousers", label: "Trousers", target: "trousers" },
  ];

  const renderLink = (link: { key: string; label: string; target: string }) => {
    const href = `/${link.target}`;
    const active = pathname === href;
    return (
      <Link
        key={link.key}
        href={href}
        className={`side-link ${active ? "active" : ""}`}
        onClick={onNavigate}
      >
        {link.label}
        <span className="side-arrow">→</span>
      </Link>
    );
  };

  return (
    <nav className={`side-nav ${open ? "open" : ""}`}>
      {links.map(renderLink)}

      <div className="nav-heading">Categories</div>
      {categories.map(renderLink)}
    </nav>
  );
}
