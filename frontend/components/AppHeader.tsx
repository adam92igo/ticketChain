"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Ticket, X } from "lucide-react";
import { ProfileSwitcher } from "@/components/ProfileSwitcher";
import { WalletStatus } from "@/components/WalletStatus";
import { clientNavigationItems, organizerNavigationItems } from "@/config/app";

export function AppHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const organizerActive = pathname.startsWith("/organizer") || pathname.startsWith("/gate");
  const navigationItems = organizerActive ? organizerNavigationItems : clientNavigationItems;

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <header className="app-header">
      <div className="header-primary">
        <Link className="brand-lockup" href="/" aria-label="TicketChain home">
          <span className="brand-mark"><Ticket size={20} /></span>
          <span>TicketChain</span>
        </Link>
        <ProfileSwitcher />
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
          const active = pathname.startsWith(item.href);
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
