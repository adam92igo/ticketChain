import { normalizeTokenId } from "@/lib/ticketState";

export function parseGateQrToken(value: string): string | null {
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin || url.pathname !== "/verify") return null;

    return normalizeTokenId(url.searchParams.get("tokenId") || "");
  } catch {
    return null;
  }
}
