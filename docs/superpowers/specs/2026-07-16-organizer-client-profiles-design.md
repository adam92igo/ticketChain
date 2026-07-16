# TicketChain — profils Client et Organisateur

## Objectif

Faire évoluer TicketChain d'un ensemble de pages de démonstration vers une fonctionnalité de billetterie intégrable : une expérience Client conserve le billet NFT, la revente contrôlée et la vérification, tandis qu'un portail Organisateur centralise les concerts et les billets émis.

La direction artistique TicketChain existante est conservée. Cette évolution est une clarification des parcours, pas une imitation visuelle de Ticketmaster ni un rebranding.

## Décisions produit

- Deux profils restent visibles en permanence dans l'en-tête : **Client** et **Organisateur**.
- Le profil est un contexte d'interface, pas une autorisation dérivée du wallet connecté.
- L'espace Organisateur est consultable sans wallet et affiche exclusivement des données on-chain réelles.
- Les écritures blockchain restent soumises aux autorisations du contrat : seul le wallet propriétaire du contrat peut créer un concert, émettre un billet et enregistrer son utilisation.
- La liste organisateur présente tous les concerts créés par le contrat. Le contrat actuel ne possédant qu'un seul organisateur (`owner`), cette liste correspond aux concerts créés par cet organisateur.
- Le détail d'un concert affiche tous les **billets émis**. Il ne prétend pas distinguer les billets achetés des billets attribués manuellement, car le contrat actuel ne conserve pas cette distinction.

## Architecture de navigation

### En-tête partagé

`AppHeader` reçoit un sélecteur persistant à deux choix :

- **Client** : liens vers les parcours client ;
- **Organisateur** : lien vers le nouveau portail `/organizer`.

Le sélecteur détermine les liens et la destination de navigation. Il n'affiche jamais de données inventées et ne remplace pas les contrôles `isOwner` nécessaires aux transactions.

### Parcours Client

Les routes existantes restent toutes disponibles :

| Route | Responsabilité après la refonte |
| --- | --- |
| `/` | Présentation TicketChain et accès au parcours client. |
| `/concerts` | Catalogue de concerts réels et achat primaire. Les outils d'administration ne s'y trouvent plus. |
| `/tickets` | Billets du wallet connecté, QR, revente et transfert. |
| `/marketplace` | Inspection et achat d'une revente par token ID exact. |
| `/verify?tokenId=<id>` | Vérification publique QR avec validation numérique. |
| `/about` et `/demo` | Explication du produit et scénario de démonstration actualisé. |

`/marketplace` conserve son modèle exact-token : aucune découverte globale de listings n'est ajoutée.

### Parcours Organisateur

Une nouvelle route `/organizer` contient les deux états suivants :

- sans `concertId`, la vue liste tous les concerts réels avec nom, lieu, date, capacité et total émis ;
- avec `concertId` numérique, la vue affiche le détail de ce concert et la liste de tous ses billets émis.

Le détail organisateur rend, pour chaque billet : token ID, détenteur actuel, état valide/utilisé, état de revente, prix de revente le cas échéant, lien de vérification publique et lien vers le contrôle d'entrée.

Les formulaires **Créer un concert** et **Émettre un billet** vivent dans le portail organisateur. Ils sont visibles pour expliquer la fonction métier, mais désactivés avec une explication lorsque le wallet propriétaire du contrat n'est pas connecté sur Sepolia.

`/gate` reste inchangée dans son principe et est accessible depuis le détail de concert. Elle conserve la règle critique : le résultat ne passe à « utilisé » qu'après le reçu de confirmation de `markAsUsed`.

## Extension ciblée du contrat

Le contrat doit exposer une lecture explicite des billets rattachés à un concert afin d'éviter une énumération globale des NFT dans le frontend.

### État ajouté

```solidity
mapping(uint256 => uint256[]) private _concertTicketIds;
```

### Écriture lors de l'émission

Dans `_mintTicket`, juste après l'attribution du `tokenId` au concert, le contrat ajoute l'identifiant à `_concertTicketIds[concertId]`. Cet unique chemin couvre à la fois `buyTicket` et `mintTicket`.

### Lecture ajoutée

```solidity
function getConcertTicketIds(uint256 concertId) external view returns (uint256[] memory) {
    require(_concerts[concertId].active, "Concert does not exist");
    return _concertTicketIds[concertId];
}
```

La fonction est une lecture publique cohérente avec les données de vérification déjà publiques. Le frontend la combine avec `getTicket` et `ownerOf` pour construire la liste organisateur. Aucun backend, indexeur ou stockage auxiliaire n'est introduit.

La modification impose :

- l'ajout intentionnel de la fonction dans `frontend/config/ticketchainAbi.ts` ;
- le test contractuel de l'indexation des billets par concert ;
- un nouveau déploiement Sepolia ;
- la mise à jour locale de `NEXT_PUBLIC_CONTRACT_ADDRESS` sans jamais committer `frontend/.env.local`.

Les données du contrat Sepolia actuellement configuré ne sont pas migrées vers le nouveau contrat.

## Preuve de propriété au portique

Le QR conserve son rôle de vérification publique : il confirme l'existence du NFT, son concert, son propriétaire on-chain et son état utilisé/non utilisé. Un QR partagé ne démontre pas à lui seul le contrôle d'un wallet.

La page `/verify?tokenId=<id>` ajoute un mode explicite de preuve : le détenteur connecte MetaMask et l'interface compare l'adresse connectée avec `verification.owner`.

- adresses égales : affichage **Propriété du wallet confirmée** ;
- adresse différente : affichage explicite que le wallet connecté n'est pas le détenteur du NFT ;
- aucun wallet connecté : la vérification publique reste disponible et la preuve de propriété est proposée sans être simulée.

Le contrôle staff dans `/gate` conserve la vérification publique et la transaction owner-only `markAsUsed`. La démonstration explique que le détenteur effectue la preuve sur son propre téléphone avant l'enregistrement d'entrée par le personnel.

## États, erreurs et sécurité

- Les token IDs restent strictement numériques sur `/verify` ; les paramètres invalides conservent le message existant.
- Les billets inconnus restent traités comme un résultat invalide propre, sans revert.
- Les transactions rejetées, échouées ou revertées ne déclenchent aucune mise à jour optimiste de l'état des billets.
- Aucun faux concert, faux billet, faux propriétaire ou faux listing ne sera affiché lorsqu'un wallet ou Sepolia n'est pas disponible.
- Le sélecteur de profil ne contourne jamais `onlyOwner` : il ne modifie que l'orientation de l'interface.
- Le contrat, ABI, données et endpoints restent strictement Sepolia ; aucun secret ne devient public.

## Vérification prévue

1. Tests Hardhat : créer deux concerts, émettre ou acheter des billets pour chacun, puis vérifier que `getConcertTicketIds` retourne les IDs du bon concert dans l'ordre d'émission.
2. Tests de comportements inchangés : plafond de revente, transfert, vérification des inconnus et blocage des billets utilisés.
3. Vérification manuelle client : achat, affichage dans Mes billets, QR direct, revente par token ID, transfert.
4. Vérification manuelle organisateur : liste des concerts, détail du bon concert, détenteur et état de chaque billet, contrôles verrouillés avec un wallet non propriétaire.
5. Vérification de propriété : un wallet détenteur est confirmé ; un autre wallet est refusé ; l'absence de connexion ne casse pas la lecture QR publique.
6. Vérification Gate : le ticket n'apparaît utilisé qu'après confirmation ; un rejet MetaMask laisse l'état inchangé.
7. Commandes obligatoires depuis la racine : `git diff --check`, `npm test`, `npm run compile` et `npm run frontend:build`.
8. Contrôle visuel des routes modifiées à largeur desktop et 390 px, puis contrôle du statut Git et restauration de la version utilisateur de `frontend/next-env.d.ts` si le build l'a régénérée.
