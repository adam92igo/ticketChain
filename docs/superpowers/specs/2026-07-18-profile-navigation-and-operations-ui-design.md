# Navigation par profil et clarification des opérations

## Objectif

Rendre les espaces Client et Organisateur cohérents, alléger la collection My Tickets et expliciter les deux opérations organisateur qui sont aujourd'hui ambiguës : l'émission après une vente partenaire et le contrôle d'entrée.

## Navigation

La navigation principale ne montre que les écrans correspondant au travail du profil actif.

- **Client** : Events, My Tickets, Resale, Verify.
- **Organisateur** : Organizer Portal, Gate Check.
- **Demo** et **About** restent des routes publiques existantes, mais sortent de la navigation par profil. Elles deviennent des liens de pied de page neutres.

Le changement de profil reste explicite via le sélecteur Client / Organisateur. Les liens internes aux deux profils vont vers leurs écrans racines (`/concerts` et `/organizer`). Aucun rôle, wallet ou état d'authentification supplémentaire n'est introduit.

## Page de démonstration

`/demo` devient un **Scénario de présentation** : une checklist concise pour préparer ou dérouler une démonstration, plutôt qu'une rubrique de navigation organisateur.

Elle décrit l'ordre et l'intérêt de chaque preuve : création du concert, émission après vente partenaire, propriété client et QR, revente, contrôle d'entrée, billet utilisé, puis annulation sur un second concert. Elle ne crée aucune donnée et ne simule aucun résultat blockchain.

`/about` reste une page produit neutre, destinée à expliquer la valeur de TicketChain, pas à réaliser une opération Client ou Organisateur.

## Émission après vente partenaire

Le panneau Organisateur explique le mécanisme directement là où l'action se déroule :

1. un partenaire de billetterie confirme un paiement hors de l'application ;
2. l'organisateur sélectionne le concert et saisit le wallet de l'acheteur ;
3. la signature MetaMask de l'organisateur émet réellement le NFT vers ce wallet.

Le texte indique explicitement qu'il s'agit d'une représentation visible du webhook de production, sans prétendre qu'un webhook ou un paiement automatique existe dans ce MVP. Le bouton emploie le même vocabulaire : confirmer la vente partenaire et émettre le billet.

## My Tickets

La collection devient une liste compacte : une entrée par billet, avec la référence lisible, le concert, date et lieu, le statut et les informations de revente utiles au premier niveau.

Le QR, le lien de vérification, les références techniques, la mise en revente et le transfert sont conservés mais placés dans un détail extensible par billet. Les actions restent indisponibles pour un billet utilisé ou expiré. Les données restent uniquement issues du contrat et de la collection du wallet connecté.

## Gate Check

La page décrit son public dès l'en-tête : personnel d'entrée de l'organisateur. Son objectif est de scanner ou saisir une référence de billet, décider l'accès à partir de Sepolia, puis enregistrer une entrée uniquement avec le wallet organisateur.

La vérification reste ouverte en lecture seule. L'action `Mark as Used` reste réservée au propriétaire du contrat et ne met l'interface à jour qu'après confirmation de la transaction.

## Hors périmètre

- Aucun changement de contrat, ABI ou déploiement.
- Aucun backend, webhook réel, indexeur ou authentification.
- Aucun billet, concert ou résultat de marketplace inventé.
- Aucune suppression des routes `/demo` ou `/about`.

## Validation

- Les menus Organisateur ne proposent plus Demo ni About ; le menu Client ne propose que ses opérations.
- Demo et About sont accessibles depuis le pied de page et leurs routes directes continuent de fonctionner.
- Les explications Partner sale et Gate Check sont compréhensibles sans documentation externe.
- My Tickets est lisible sous forme de liste au desktop et à 390 px, sans retirer les actions existantes.
- Le comportement confirmé uniquement de Gate Check et la navigation `/verify?tokenId=<id>` sont préservés.
