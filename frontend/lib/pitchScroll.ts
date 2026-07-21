export function parsePitchScrollPosition(value: string | null, currentPath: string): number | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as { path?: unknown; y?: unknown };
    if (parsed.path !== currentPath || typeof parsed.y !== "number" || !Number.isFinite(parsed.y) || parsed.y < 0) return null;
    return parsed.y;
  } catch {
    return null;
  }
}
