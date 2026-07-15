import Link from "next/link";
import { ArrowRight, ShieldCheck, TicketPlus, ScanLine, Users } from "lucide-react";

const adminActions = [
  {
    href: "/concerts",
    title: "Créer un concert et mint des tickets",
    description: "Accès organisateur pour ouvrir une nouvelle offre et préparer l’inventaire.",
    icon: TicketPlus
  },
  {
    href: "/gate",
    title: "Contrôle d’entrée",
    description: "Valider un ticket, vérifier son état et marquer l’usage après confirmation.",
    icon: ShieldCheck
  },
  {
    href: "/verify",
    title: "Vérification directe",
    description: "Contrôler l’authenticité d’un token sans dépendre d’un back-office central.",
    icon: ScanLine
  },
  {
    href: "/demo",
    title: "Guide de démo",
    description: "Préparer le scénario de présentation pour le jury, les partenaires ou les tests.",
    icon: Users
  }
] as const;

export default function AdminPanelPage() {
  return (
    <div className="route-page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Panel admin</h1>
          <p>
            Cette vue regroupe les actions réservées à l’organisateur. Elle permet de créer l’offre, préparer les tickets et superviser la validation d’entrée.
          </p>
        </div>
      </section>

      <section className="section-block" aria-label="Admin tools">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Actions principales</p>
            <h2>Tout l’espace organisateur en un seul endroit</h2>
          </div>
        </div>
        <div className="panel-grid">
          {adminActions.map((action) => {
            const Icon = action.icon;
            return (
              <article key={action.href} className="panel-card">
                <span className="story-icon"><Icon size={20} /></span>
                <h3>{action.title}</h3>
                <p>{action.description}</p>
                <Link href={action.href} className="inline-link">
                  Ouvrir <ArrowRight size={14} />
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
