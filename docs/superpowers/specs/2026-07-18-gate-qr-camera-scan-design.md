# Scan caméra QR pour Gate Check

## Objectif

Permettre au personnel d'entrée d'un organisateur de scanner le QR TicketChain d'un billet depuis Gate Check, puis de lancer automatiquement la vérification Sepolia déjà existante.

## Parcours utilisateur

1. Le personnel ouvre `/gate` et sélectionne **Scanner le QR**.
2. L'application demande l'accès à la caméra uniquement à ce moment-là.
3. Le scanner lit un QR contenant le lien TicketChain `/verify?tokenId=<id>`.
4. L'application valide que le numéro est numérique, arrête la caméra, remplit le numéro de billet et déclenche le même contrôle on-chain que la saisie manuelle.
5. Gate Check affiche la décision existante : accepté, déjà utilisé, concert annulé ou invalide.
6. Le wallet organisateur peut toujours enregistrer un billet valide comme utilisé ; cette écriture reste confirmée par MetaMask avant toute mise à jour de l'écran.

## Interface

Gate Check conserve la saisie manuelle comme solution de secours. Un bouton secondaire **Scanner le QR** ouvre un panneau caméra explicite avec une action d'annulation. Le scanner est un outil du personnel d'entrée, pas une preuve que le présentateur contrôle le wallet propriétaire.

Un QR qui ne correspond pas à un lien TicketChain avec un `tokenId` numérique reste sans effet sur la décision d'entrée. Le panneau indique qu'il faut présenter un QR TicketChain ou saisir le numéro manuellement. Si la caméra est refusée, absente ou indisponible, le panneau explique le problème et laisse la saisie manuelle disponible.

## Mise en œuvre

Une dépendance QR dédiée et maintenue est autorisée pour ce besoin de scanner caméra. Elle est chargée uniquement dans le composant client Gate Check afin d'éviter tout accès caméra pendant le rendu serveur.

La logique de contrôle est factorisée afin que la saisie manuelle, le paramètre URL `tokenId` et le QR scanné appellent la même vérification avec un identifiant explicite. Cela évite de dépendre d'une mise à jour React asynchrone du champ après le scan.

Les frames caméra restent dans le navigateur : aucune image, adresse, QR ou résultat n'est envoyé à un backend. Aucune donnée blockchain n'est inventée ; la décision reste issue de `verifyTicket` sur Sepolia.

## Contraintes

- Aucun changement de contrat Solidity ni d'ABI.
- Préserver `/verify?tokenId=<id>` et la saisie manuelle numérique.
- Préserver le comportement confirmé uniquement de `Mark as Used`.
- Aucun backend, indexeur, authentification ou stockage de scan.
- Le scanner valide strictement le format TicketChain avant de déclencher la lecture on-chain.

## Validation

- Un QR TicketChain valide préremplit Gate Check et affiche la décision correspondante.
- Un QR invalide ne déclenche aucune vérification de billet ni changement d'état d'entrée.
- Refuser la caméra conserve la saisie manuelle utilisable.
- Annuler le scanner libère la caméra et ferme le panneau.
- Les états validé, utilisé, annulé et inconnu restent ceux du contrat.
- La vérification automatisée et manuelle ne permettent pas d'afficher un billet utilisé après une transaction MetaMask refusée ou échouée.
