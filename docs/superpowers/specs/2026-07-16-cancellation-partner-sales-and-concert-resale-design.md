# TicketChain — annulation, vente partenaire et revente par concert

## Objectif

Faire évoluer TicketChain comme une fonctionnalité de billetterie intégrable à une plateforme telle que Ticketmaster : l'organisateur émet un NFT après une vente partenaire, peut annuler un concert et invalider immédiatement ses billets, tandis que le client utilise une collection de billets plus claire et explore la revente par concert.

L'identité visuelle TicketChain existante est conservée. Les identifiants blockchain restent techniques ; l'interface privilégie les noms de concerts et des libellés lisibles tels que « Événement #1 » et « Billet #12 ».

## Vente partenaire sans backend

Le MVP ne crée pas de backend, de webhook réel ou de wallet de service. Une intégration de production recevrait une confirmation de paiement d'un partenaire et ferait appeler le contrat par un service sécurisé.

La démonstration montre ce modèle avec une action organisateur réelle :

1. L'organisateur sélectionne un concert.
2. Il colle l'adresse wallet de l'acheteur provenant de la plateforme partenaire.
3. Il confirme « Vente partenaire confirmée → émettre le NFT » dans MetaMask.
4. Le contrat émet le NFT vers cette adresse et le billet apparaît dans le registre du concert.

Le concert sélectionné est utilisé automatiquement. Le MVP ne prétend pas que cette signature manuelle est un webhook automatique ; le texte explique qu'elle représente l'étape que Ticketmaster automatiserait dans une intégration de production.

## Annulation de concert

L'annulation est une opération on-chain owner-only. Un concert n'est jamais supprimé : son historique, ses billets et son identité restent consultables.

### Contrat

- Ajouter `cancelConcert(uint256 concertId)` réservé au propriétaire du contrat.
- Cette fonction désactive le concert et émet un événement `ConcertCancelled(uint256 indexed concertId)`.
- `getConcert` et `getConcertTicketIds` acceptent un concert annulé afin que le portail organisateur conserve son historique ; ils rejettent uniquement un ID qui n'a jamais existé.
- Un billet d'un concert annulé est expiré immédiatement : `verifyTicket` retourne `valid: false` et expose explicitement l'état actif du concert.
- Les opérations suivantes exigent un concert actif : achat primaire, mint manuel/partenaire, mise en vente, achat de revente et transfert.
- Les autres concerts et leurs billets conservent leur comportement actuel.

### Frontend

- L'organisateur voit une action « Annuler le concert » avec une confirmation explicite indiquant que les billets émis deviendront expirés.
- Le portail continue à afficher l'événement avec le statut « Annulé » et le total de billets émis.
- Les cartes client, QR et Gate Check montrent « Concert annulé / Entrée refusée » ; ils ne présentent pas un billet annulé comme « Déjà utilisé ».
- L'interface ne bascule vers l'état annulé qu'après la confirmation de transaction existante dans `runTransaction`.

## Identifiants et présentation des billets

- Les IDs numériques restent la source de vérité et restent disponibles en référence technique.
- Les listes organisateur affichent `Nom du concert · Événement #<id>` et les billets `Nom du concert · Billet #<tokenId>`.
- Le détail organisateur affiche l'ID technique du concert dans un emplacement secondaire et ne demande plus de le ressaisir lorsqu'un concert est sélectionné.
- La page My Tickets devient une collection de billets visuels compacts : concert, date, lieu, statut, numéro lisible, QR, détails techniques repliables et actions de revente/transfert rattachées à chaque billet.
- Les billets expirés n'exposent pas les actions de revente ou de transfert.

## Revente par concert

- La marketplace commence par sélectionner un concert réel on-chain, puis lit uniquement `getConcertTicketIds(concertId)`.
- Elle filtre ces billets côté client pour n'afficher que les billets réellement listés et encore valides.
- Si aucun billet n'est listé, l'écran affiche « Aucun billet en revente pour ce concert ».
- Il n'y a pas de découverte globale de listings, de backend, d'indexeur, de données inventées ou de catalogue fictif.
- Chaque listing présente le nom du concert, « Billet #<tokenId> », le prix on-chain, le plafond de revente et le vendeur actuel.

## CI GitHub Actions

Créer un workflow GitHub Actions déclenché sur chaque `push` et `pull_request`.

- Utiliser Node.js 22 et `npm ci` à la racine et dans `frontend/`.
- Exécuter `npm test`, `npm run compile` et `npm run frontend:build`.
- Ne jamais lancer de déploiement Sepolia, ne pas demander de secrets et ne pas créer de fichier `.env` dans CI.
- Le workflow échoue si les tests, la compilation ou le build échouent.

## Tests et déploiement

Ajouter des tests contractuels pour l'annulation : autorisation owner-only, lecture historique, invalidation immédiate, refus de mint/achat/revente/transfert et isolation des autres concerts.

Ajouter ou étendre les tests de helpers frontend pour l'état « Concert annulé ». Le build frontend reste le contrôle d'intégration TypeScript. Vérifier manuellement MetaMask : refus d'annulation sans faux état, confirmation d'annulation, QR expiré, Gate Check refusé et marketplace vide pour le concert annulé.

La modification du contrat et de l'ABI impose un nouveau déploiement Sepolia et la mise à jour locale, non versionnée, de `NEXT_PUBLIC_CONTRACT_ADDRESS`. La documentation doit distinguer les anciens déploiements incompatibles du nouveau contrat compatible.
