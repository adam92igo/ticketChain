# Communication Strategy & Value Proposition

Repris et reformaté à partir du contenu déjà présent dans `README.md` (sections 2 et 3) et `docs/PROJECT_CONTEXT.md`, pour correspondre au format attendu par le brief : une proposition de valeur en une ligne + 3 messages clés + un plan de canaux.

## Proposition de valeur (test : compréhensible par un enfant de 12 ans)

> **Des billets de concert qu'on ne peut ni copier, ni revendre trop cher, ni utiliser deux fois.**

Variante plus longue si besoin d'une phrase de contexte : "TicketChain transforme chaque billet de concert en un objet numérique unique, impossible à falsifier, dont le prix de revente est plafonné et dont l'usage est vérifié à l'entrée."

## 3 messages clés

Adaptés au persona principal retenu (Karim, l'opérateur de billetterie — cf. `persona.md`) : le message s'adresse d'abord à celui qui achète/adopte, avec la douleur du fan (Léa) comme preuve du problème.

1. **Vous captez la revente au lieu de la subir.** Aujourd'hui le marché noir (Vinted, groupes Facebook, bots) empoche toute la valeur de la spéculation sans que vous touchiez un centime — TicketChain plafonne la revente dans le contrat et vous en reverse une commission.
2. **Authenticité garantie, vérifiable par n'importe qui.** Chaque billet est un NFT unique : fini les faux billets et les doublons vendus à plusieurs personnes, prouvable publiquement sur un explorateur de blocs.
3. **Entrée sans fraude.** Au contrôle d'accès, le détenteur doit prouver avec son propre wallet qu'il possède réellement le billet — une capture d'écran ou une photo ne suffit pas.

## Ton

Concret et orienté revenu pour l'acheteur B2B (Karim), pas seulement technique. On commence par ce qu'il perd aujourd'hui (revente qui lui échappe, fraude, image ternie), puis on montre comment TicketChain le récupère. La blockchain est la réponse à "comment on prouve que c'est vrai", pas l'argument de vente en soi.

## Plan de canaux

1. **Un canal en premier** : démarchage direct d'une ou deux petites salles de concert indépendantes (segment de tête de pont retenu, voir `unit-economics-gtm.md`) pour un événement pilote — pas de dispersion multi-canal tant que ce premier partenariat n'est pas signé.
2. **Preuve avant discours** : montrer une vraie transaction Sepolia Etherscan plutôt que d'expliquer la technologie en abstrait, surtout face à un interlocuteur B2B sceptique.
3. **Élargir seulement après ce premier pilote réussi**, avec ses résultats concrets comme argument pour approcher des opérateurs plus grands (type Ticketmaster) en licence ou intégration.

## Trame de pitch (esquisse, à combiner avec le guide 15 minutes du brief)

1. Douleur : la revente sauvage prive les organisateurs de revenu et abîme leur image ; le fan, lui, risque l'arnaque (persona principal + secondaire, cf. `persona.md`).
2. Pourquoi maintenant / pourquoi la blockchain : preuve indépendante, impossible à falsifier, vérifiable par n'importe qui sur Etherscan.
3. Démo en direct sur le déploiement Sepolia actuel (`0xcf91d1Fcb5203152b3cAb6E320df11eDFe884259`, voir README section 10.1).
4. Conclusion : ce que vous demandez à l'auditoire (retour, mise en relation avec une salle pilote, etc. — à définir).

## Dépendances restantes

- Le message n°1 ci-dessus suppose la commission sur la revente (voir `unit-economics-gtm.md` §1) — à implémenter dans le contrat ; à présenter comme prochaine étape si ce n'est pas encore construit au moment du pitch, pas comme déjà fonctionnel.
- Une salle indépendante réelle à approcher pour le pilote reste à identifier.
