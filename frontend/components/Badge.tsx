type BadgeTone = "green" | "red" | "amber" | "blue" | "gray";

export function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: BadgeTone }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
