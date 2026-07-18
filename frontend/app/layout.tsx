import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { TransactionStatus } from "@/components/TransactionStatus";
import { CONTRACT_ADDRESS } from "@/config/app";
import { TicketChainProvider } from "@/context/TicketChainContext";
import { sepoliaAddressUrl, shortAddress } from "@/lib/format";
import "./globals.css";

export const metadata: Metadata = {
  title: "TicketChain",
  description: "Authentic concert tickets, verified on-chain."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <TicketChainProvider>
          <div className="site-shell">
            <AppHeader />
            <TransactionStatus />
            <main className="app-content">{children}</main>
            <footer className="app-footer">
              <span>Sepolia contract</span>
              {CONTRACT_ADDRESS ? (
                <a href={sepoliaAddressUrl(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer">
                  {shortAddress(CONTRACT_ADDRESS)} <ExternalLink size={13} />
                </a>
              ) : (
                <span>Not configured</span>
              )}
              <nav className="footer-links" aria-label="Product information">
                <Link href="/demo">Presentation scenario</Link>
                <Link href="/about">About</Link>
              </nav>
            </footer>
          </div>
        </TicketChainProvider>
      </body>
    </html>
  );
}
