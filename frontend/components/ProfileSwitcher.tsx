"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProfileSwitcher() {
  const pathname = usePathname();
  const organizerActive = pathname.startsWith("/organizer") || pathname.startsWith("/gate");

  return (
    <div className="profile-switcher" aria-label="Choose application profile">
      <Link className={!organizerActive ? "active" : ""} href="/concerts" aria-current={!organizerActive ? "page" : undefined}>
        Client
      </Link>
      <Link className={organizerActive ? "active" : ""} href="/organizer" aria-current={organizerActive ? "page" : undefined}>
        Organisateur
      </Link>
    </div>
  );
}
