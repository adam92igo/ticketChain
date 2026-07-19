# Preuve du wallet détenteur au portique

## Objectif

Le contrôle d'entrée ne doit plus accepter un billet uniquement parce que son QR est valide. Il doit aussi prouver que la personne présente contrôle le wallet MetaMask qui possède actuellement le NFT.

## Parcours à deux appareils

1. Le personnel scanne le QR du billet ou saisit son numéro dans Gate Check. Cela identifie le NFT et vérifie son état public sur Sepolia.
2. Si le billet est valide, Gate Check crée un défi unique, lié au numéro de billet et limité dans le temps, puis l'affiche en QR.
3. Le détenteur ouvre ce défi avec son téléphone, connecte le wallet MetaMask propriétaire et signe le message demandé.
4. Le téléphone affiche une preuve QR contenant le défi, le numéro de billet, l'adresse signataire et la signature.
5. Le personnel scanne cette preuve QR. Gate Check récupère l'adresse depuis la signature et la compare au propriétaire actuel lu sur Sepolia.
6. L'entrée est autorisée uniquement si le défi est encore valide, que le billet est valide et que l'adresse récupérée est le propriétaire actuel. Le wallet organisateur peut alors marquer le billet comme utilisé.

## Sécurité et limites

- Le QR de billet seul n'autorise jamais l'entrée : il ne sert qu'à identifier le NFT.
- Chaque défi est aléatoire, à usage unique et expire rapidement. Une capture d'une ancienne preuve ne peut donc pas être rejouée.
- La signature MetaMask ne réalise aucune transaction et ne demande aucun paiement ; elle démontre seulement le contrôle de la clé du wallet.
- Gate Check vérifie la signature localement avec ethers et la propriété actuelle avec le contrat Sepolia. Aucun backend, indexeur ou stockage de données personnelles n'est ajouté.
- Le challenge QR est créé par le portique ; le QR de preuve est lu par le portique. Cela exige le téléphone MetaMask du client et l'appareil du personnel d'entrée.

## Expérience utilisateur

Gate Check distingue trois états :

- **Billet identifié** : le QR du billet est valide, mais la preuve de wallet est attendue.
- **Présentez le défi au client** : le personnel montre le QR du défi au téléphone du détenteur.
- **Wallet détenteur confirmé** : la signature et la propriété correspondent ; l'action d'utilisation peut être proposée.

La page `/verify` devient la page mobile de preuve lorsqu'elle reçoit un défi valide dans son URL. Elle garde sa vérification publique habituelle lorsqu'aucun défi n'est présent.

## Contraintes

- Ne pas modifier le contrat ou l'ABI.
- Préserver `/verify?tokenId=<id>` et sa vérification publique directe.
- Préserver la confirmation MetaMask avant `Mark as Used`.
- Ne pas inventer de résultats de propriété ou d'entrée.
- Ne pas utiliser le wallet du personnel pour prouver le wallet du client.

## Validation

- Un QR de billet volé sans signature du wallet propriétaire reste refusé au portique.
- Une signature d'un wallet différent du propriétaire actuel reste refusée.
- Une signature valide du propriétaire actuel pour le défi actif autorise l'étape Mark as Used.
- Une preuve expirée, déjà utilisée ou liée à un autre billet reste refusée.
- Un refus de signature MetaMask ne change pas l'état du billet ni le résultat Gate Check.
