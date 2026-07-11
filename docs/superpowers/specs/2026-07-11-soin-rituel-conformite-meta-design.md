# Soin Rituel — adaptation des textes à risque pour Meta

## Objectif

Réduire les risques de refus publicitaire Meta de la page `/seances/soin-rituel` sans dénaturer son univers spirituel ni refaire son contenu.

## Portée approuvée

- Modifier seulement les formulations susceptibles d'être interprétées comme un diagnostic, une connaissance de l'état personnel du visiteur, une promesse médicale ou un résultat garanti.
- Conserver les textes déjà acceptables, le ton mystique, la structure, les images, le prix, la durée et les appels à l'action.
- Préserver « Soin Rituel » comme nom commercial, mais ajouter une mise en garde précisant la nature spirituelle et non médicale de l'expérience.

## Adaptations ciblées

- Transformer les affirmations directes sur la santé ou l'état émotionnel en invitations générales et non diagnostiques.
- Retirer les références au fait d'être malade, aux médecins, aux spécialistes et aux « troubles ».
- Remplacer les promesses certaines ou durables par des possibilités subjectives dont les ressentis peuvent varier.
- Reformuler les notions de déparasitage, blessures et purge lorsqu'elles pourraient être comprises littéralement.
- Ne pas promettre qu'une séance suffit ni attribuer une durée fixe aux effets.
- Ajouter un avis indiquant que l'expérience ne remplace pas un accompagnement médical ou psychologique.

## Source des données

La page combine des valeurs par défaut dans `src/lib/service-landing.ts` et des personnalisations possibles dans `Offering.landingContent`. L'implémentation doit corriger la source réellement utilisée localement et maintenir des valeurs par défaut prudentes.

## Vérification

- Exécuter les tests associés à `service-landing`.
- Rechercher les formulations à risque restantes dans les sources concernées.
- Vérifier visuellement la page locale si l'application peut être lancée dans l'environnement.

## Hors portée

- Aucun changement de design ou de navigation.
- Aucun changement au prix, à la durée ou au système de réservation.
- Aucune garantie d'approbation par Meta, dont la décision finale reste indépendante.
