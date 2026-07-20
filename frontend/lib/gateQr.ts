import { PUBLIC_APP_ORIGIN } from "@/config/app";

export type GateQrScanMode = "ticket" | "holder-proof";

export function parseGateQrScan(value: string, mode: GateQrScanMode): string | null {
  if (mode === "holder-proof") return value.trim() ? value : null;
  return parseGateQrToken(value);
}

export function parseGateQrToken(value: string): string | null {
  try {
    const url = new URL(value, window.location.origin);
    const allowedOrigins = new Set([window.location.origin, PUBLIC_APP_ORIGIN].filter(Boolean));
    if (!allowedOrigins.has(url.origin) || url.pathname !== "/verify") return null;

    const tokenId = url.searchParams.get("tokenId") || "";
    if (!/^\d+$/.test(tokenId)) return null;
    return BigInt(tokenId).toString();
  } catch {
    return null;
  }
}
