"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Ticket, X } from "lucide-react";
import { WalletStatus } from "@/components/WalletStatus";
import { navigationItems } from "@/config/app";

export function AppHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <header className="app-header">
      <div className="header-primary">
        <Link className="brand-lockup" href="/" aria-label="TicketChain home">
          <span className="brand-mark"><Ticket size={20} /></span>
          <span>TicketChain</span>
        </Link>
        <WalletStatus />
        <button
          className="menu-button"
          onClick={() => setMenuOpen((current) => !current)}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      <nav id="primary-navigation" className={`primary-nav ${menuOpen ? "open" : ""}`} aria-label="Primary navigation">
        {navigationItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link href={item.href} key={item.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
