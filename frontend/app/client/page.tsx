import Link from "next/link";
import { ArrowRight, CircleCheck, ShoppingCart, Ticket, ScanLine } from "lucide-react";

const clientActions = [
  {
    href: "/tickets",
    title: "Mes tickets",
    description: "Consulter ses tickets, ouvrir les QR codes et préparer une revente ou un transfert.",
    icon: Ticket
  },
  {
    href: "/marketplace",
    title: "Marketplace",
    description: "Inspecter un ticket listé à partir d’un token ID précis et l’acheter.",
    icon: ShoppingCart
  },
  {
    href: "/verify",
    title: "Vérifier un ticket",
    description: "Contrôler rapidement l’état d’un billet avant ou après une transaction.",
    icon: ScanLine
  },
  {
    href: "/about",
    title: "Comprendre le produit",
    description: "Voir comment le flux ticket, revente et contrôle d’entrée fonctionne de bout en bout.",
    icon: CircleCheck
  }
] as const;

export default function ClientPanelPage() {
  return (
    <div className="route-page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Client</p>
          <h1>Panel client</h1>
          <p>
            Cette vue rassemble tout le parcours utilisateur : consulter ses tickets, acheter un billet revendu et vérifier son état sans sortir du parcours principal.
          </p>
        </div>
      </section>

      <section className="section-block" aria-label="Client tools">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Parcours utilisateur</p>
            <h2>Le client dispose d’un espace dédié</h2>
          </div>
        </div>
        <div className="panel-grid">
          {clientActions.map((action) => {
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
