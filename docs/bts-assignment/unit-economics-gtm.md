# Unit Economics & Go-to-Market

Décisions prises (2026-07-20) : commission sur la revente comme modèle de frais, petites salles indépendantes comme segment de tête de pont, avec une ambition de montée en gamme vers des opérateurs type Ticketmaster une fois le modèle prouvé (voir `persona.md`).

## 1. Modèle de revenu retenu — commission sur la revente

`contracts/TicketChain.sol` ne prélève aujourd'hui **aucune commission** : la revente se fait au prix plafonné (`maxResalePrice`) payé intégralement au vendeur via `buyResaleTicket`. Pour facturer une commission sur la revente comme décidé, il faut un **changement de contrat** : `buyResaleTicket` devrait retenir X% du prix de revente au profit d'une adresse plateforme (ou de l'organisateur, selon le partage négocié), avant de créditer le vendeur.

**Point important à signaler à l'équipe :** ceci n'est pas encore implémenté — c'est un vrai travail d'ingénierie restant, pas juste une case business à cocher. Je peux créer une wave Wavecode dédiée (proposition + décision founder, puisque ça touche le contrat protégé) si vous voulez la suivre comme les autres chantiers. Pour le pitch, il est possible de présenter ce mécanisme comme la prochaine étape technique plutôt que comme déjà construit — à condition de le dire clairement, pas de le laisser paraître comme fonctionnel dans la démo.

## 2. Tableau d'économie unitaire (par ticket revendu)

| Poste | Valeur | Statut |
|---|---|---|
| Prix moyen d'un billet primaire | `[HYPOTHÈSE] 25 CHF` — à ancrer avec un vrai prix d'un événement pilote en salle indépendante | hypothèse |
| Plafond de revente (`maxResalePrice`) | `[HYPOTHÈSE] +20% du prix primaire` (paramètre déjà dans le contrat, par concert) | existant |
| Commission plateforme sur la revente | `[HYPOTHÈSE] 5-10% du prix de revente` | à trancher, et à implémenter (§1) |
| Coût gas (Sepolia = gratuit ; en prod sur L2, ex. Base/Arbitrum) | `[HYPOTHÈSE] quelques centimes par transaction sur une L2, négligeable` | dépend de la chaîne cible en prod |
| Coût d'acquisition par salle partenaire (CAC B2B) | `[À ESTIMER]` — démarchage direct de salles indépendantes, pas de canal payant au départ | dépend du rythme de démarchage |
| Marge nette par ticket revendu | `= commission − gas − CAC amorti sur le volume de la salle` | calculable une fois §1 implémenté et un prix réel confirmé |

## 3. Go-to-market

**Segment de tête de pont : petites salles de concert indépendantes (200-500 places).** Douleur immédiate et concrète (revente sauvage qui nuit à leur image, aucune commission captée aujourd'hui), cycle de vente court comparé à un acteur du niveau de Ticketmaster.

**Trajectoire de montée en gamme :** prouver le modèle (plafond de revente + commission + anti-fraude) avec 1-2 salles pilotes → utiliser ces résultats concrets comme preuve pour approcher des opérateurs de billetterie plus grands (type Ticketmaster) en licence ou intégration, une fois la mécanique validée en conditions réelles.

**Canaux :**
- Démarchage direct d'une ou deux salles indépendantes locales pour un événement pilote (le vrai premier "client").
- Communautés Discord/Reddit de fans du genre musical de la salle pilote, pour recruter les premiers acheteurs/revendeurs côté demande.
- Preuve à l'écran (transactions Sepolia Etherscan) plutôt qu'un discours abstrait sur la blockchain, pour convaincre une salle sceptique.

**Plan "100 premiers utilisateurs" :**
1. Un événement pilote avec une salle partenaire réelle (le premier "client" payant, même à titre gratuit/pilote pour commencer).
2. Recrutement des premiers acheteurs/revendeurs via la communauté de cette salle.
3. Mesurer : taux de billets vérifiés au gate, taux de revente captée par la plateforme vs. revente qui s'échappe encore vers Vinted/Facebook.

## Questions encore ouvertes

1. Taux de commission exact sur la revente (§2) — une fourchette réaliste à trancher avec l'équipe business.
2. Avez-vous déjà identifié une salle indépendante réelle à approcher pour le pilote, ou est-ce encore à faire (lien direct avec le "dossier de preuves de validation" — point 2 du plan, pas encore traité) ?
3. Voulez-vous que je crée la wave Wavecode "Commission sur la revente" pour suivre l'implémentation du contrat (§1) comme un chantier à part ?
