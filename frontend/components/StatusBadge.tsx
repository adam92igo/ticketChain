import { Badge } from "@/components/Badge";
import type { StatusTone } from "@/lib/ticketState";

export function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
  return <Badge tone={tone}>{label}</Badge>;
}
