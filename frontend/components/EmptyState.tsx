import type { ReactNode } from "react";
import { Ticket } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
  icon
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon || <Ticket size={22} />}</div>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
        {action ? <div className="empty-state-action">{action}</div> : null}
      </div>
    </div>
  );
}
