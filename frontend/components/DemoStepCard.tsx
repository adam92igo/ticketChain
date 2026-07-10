export function DemoStepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <article className="demo-step-card">
      <span>{String(number).padStart(2, "0")}</span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  );
}
