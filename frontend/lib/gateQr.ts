export type GateQrScanMode = "ticket" | "holder-proof";

export function parseGateQrScan(value: string, mode: GateQrScanMode): string | null {
  if (mode === "holder-proof") return value.trim() ? value : null;
  return parseGateQrToken(value);
}

export function parseGateQrToken(value: string): string | null {
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin || url.pathname !== "/verify") return null;

    const tokenId = url.searchParams.get("tokenId") || "";
    if (!/^\d+$/.test(tokenId)) return null;
    return BigInt(tokenId).toString();
  } catch {
    return null;
  }
}
