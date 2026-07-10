"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { CONTRACT_ADDRESS } from "@/config/app";
import { sepoliaNftUrl } from "@/lib/format";

export function QRCodeBlock({ tokenId }: { tokenId: bigint }) {
  const [origin, setOrigin] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const path = `/verify?tokenId=${tokenId.toString()}`;
  const url = `${origin}${path}`;

  useEffect(() => setOrigin(window.location.origin), []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1600);
    } catch {
      setCopyState("failed");
    }
  };

  return (
    <div className="ticket-qr-panel">
      <QRCodeSVG
        value={url}
        size={132}
        level="H"
        marginSize={4}
        title={`Verification QR code for TicketChain token ${tokenId.toString()}`}
        className="ticket-qr"
      />
      <div className="qr-copy">
        <p className="qr-label">Scan to verify</p>
        <code>{path}</code>
        <button className="secondary-button full" onClick={() => void copyLink()}>
          <Copy size={15} />
          {copyState === "copied" ? "Copied" : copyState === "failed" ? "Copy failed" : "Copy verification link"}
        </button>
        {copyState === "failed" ? <p className="field-error">Open the verification page and copy its URL instead.</p> : null}
      </div>
      <div className="ticket-links">
        <Link href={path}>Open verification page</Link>
        <a href={sepoliaNftUrl(CONTRACT_ADDRESS, tokenId)} target="_blank" rel="noreferrer">
          View NFT on Sepolia <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}
