import { PUBLIC_APP_ORIGIN } from "@/config/app";

export function resolvePublicOrigin(browserOrigin: string): string {
  return PUBLIC_APP_ORIGIN || browserOrigin;
}
