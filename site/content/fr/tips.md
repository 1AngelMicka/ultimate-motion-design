# Astuces et prompts

Ce qui fait la différence entre une vidéo correcte et une vidéo qu'on partage : un brief précis, un style éprouvé, des images fixes validées avant d'animer, et quelques tours de critique exigeante. Tout est ici, prêt à copier.

## La formule d'un bon brief

Une phrase par point suffit. `/umd:go` pose les questions qui manquent, mais plus tu en dis au départ, moins il en pose.

| Point | Exemple |
| --- | --- |
| Quoi | Une vidéo de lancement pour Notio, notre app de notes |
| Pour qui, où | Des indépendants qui scrollent LinkedIn, son coupé par défaut |
| Format | 30 s, 16:9 et une version 9:16 |
| Ce qu'il faut retenir | « Tes notes se rangent toutes seules » et le lien d'essai |
| Ambiance, en mots | Sombre et précis, comme une keynote logicielle ; plans courts, l'interface est la star |
| Contraintes | Logo en `brand/logo.svg`, couleur #3D5AFE, police Inter, pas de visage |
| Exigence | Niveau agence (note cible 8) |

Décris les références avec tes mots : durée des plans, place de la caméra, façon dont les éléments entrent dans le cadre. Ne demande jamais de copier la vidéo de quelqu'un.

## Prompts prêts à copier

Remplace ce qui est entre crochets.

**Lancement produit**

```
/umd:go une vidéo de lancement de 30 s pour [produit], [ce qu'il fait en une phrase]. Public : [qui]. Ambiance : sombre et précise, l'interface est la star, un seul moment fort quand [la fonctionnalité clé] apparaît. Fin sur le logo et [l'appel à l'action]. 16:9 et 9:16. Musique, pas de voix.
```

**Vidéo de présentation d'entreprise**

```
/umd:go une vidéo de présentation de 60 s pour [entreprise]. Message : [la promesse en une phrase]. Trois parties : le problème, ce qu'on fait, la preuve ([chiffres réels]). Voix off française posée, sous-titres incrustés, musique discrète. Charte : [couleurs, police, logo].
```

**Explainer**

```
/umd:go un explainer de 45 s qui explique [le concept] à [public]. Une idée par plan, des schémas qui se construisent sous les yeux, aucun texte de plus de 6 mots à l'écran. Voix off et sous-titres mot à mot.
```

**Short vertical pour les réseaux**

```
/umd:go un short 9:16 de 20 s pour [plateforme] sur [sujet]. Accroche dans la première seconde, une info toutes les 2 secondes, sous-titres karaoké dans la zone sûre, fin en boucle. Musique rythmée, coupes sur les temps forts.
```

**Logo animé**

```
/umd:go une animation de logo de 4 s à partir de [chemin du logo SVG]. Le logo se construit à partir de [forme ou idée liée à la marque], un seul geste, fin nette, signature sonore courte. Versions fond clair et fond sombre, et une en WebM transparent.
```

**Data story**

```
/umd:go une vidéo de 40 s qui raconte ces chiffres : [données ou fichier CSV]. Un graphique qui se dessine, des chiffres qui comptent, une annotation manuscrite sur le chiffre clé. Style data journalism.
```

**Page web animée ou hero 3D**

```
/umd:go la section hero animée de [site] en [framework]. Références : [2 ou 3 sites décrits en mots]. Un fond shader discret, le titre qui se révèle mot à mot, 60 images/s sur mobile, prefers-reduced-motion respecté.
```

**Court métrage**

```
/umd:go un court métrage animé de 45 s : [personnage] veut [petite chose], essaie, [imprévu], et finit par regarder la caméra. Style [style choisi]. Musique et bruitages, pas de dialogue.
```

## Choisir un style

Partir d'un style éprouvé est le raccourci le plus efficace vers un rendu haut de gamme. `/umd:storyboard` te propose trois styles. Tu peux aussi chercher toi-même, sans dépenser de tokens :

```
node <plugin>/scripts/umd.mjs styles luxe sombre lancement
```

| Ambiance | Styles à essayer |
| --- | --- |
| Tech, logiciel, keynote | `lemo:dark-keynote`, `mg:22-hud`, `lemo:swiss-motion` |
| Luxe, premium | `lemo:art-deco`, `lemo:glass-product` |
| Explication, pédagogie | `lemo:whiteboard`, `lemo:dataviz`, `lemo:iso-infographic` |
| Ludique, chaleureux | `lemo:paper-popup`, `lemo:rubber-hose`, `mg:05-cel-boil` |
| Rétro | `mg:10-synthwave`, `lemo:risograph`, `lemo:silent-film` |
| Organique, artistique | `mg:07-liquid`, `lemo:watercolor`, `lemo:ink-wash` |

Les aperçus sont sur les galeries de [lemo-opuscar](https://lemomo-ai.github.io/lemo-opuscar/) et de [mg-styles-15](https://vincentwei1021.github.io/mg-styles-15/). Plus de 700 autres prompts sont dans [awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos).

## Pendant la production : quoi dire

Quand `/umd:go` te montre les images fixes ou un brouillon, sois précis : un instant, un problème, ce que tu veux.

- « À 2,4 s, le titre arrive en même temps que l'image : fais entrer l'image d'abord, le titre 8 images plus tard. »
- « Le moment fort manque : je veux un vrai temps fort quand [X] apparaît. »
- « C'est trop sage : garde le style mais pousse le contraste et la taille du titre. »
- « La couleur d'accent est partout : réserve-la au produit. »
- « Encore un tour de critique, objectif 9. »
- « Ça fait template : change de style, propose-m'en trois autres. »

## Ce qui trahit une vidéo faite par une IA

| Signe | À la place |
| --- | --- |
| Tout entre en fondu en montant de 20 px | Des entrées variées, liées à ce que l'élément représente |
| Des points qui pulsent, des éléments qui flottent sans fin | Une vie discrète : respiration, lumière qui glisse |
| Des ressorts rebondissants partout | Des ressorts seulement quand quelque chose est lancé ou rattrapé |
| Un flou à chaque entrée | Un flou de mouvement seulement sur ce qui va vite |
| Dégradé violet, cartes en verre, mise en page centrée | La palette et la grille du style choisi |
| « Révolutionnaire », « sans effort », « libérez votre potentiel » | Des faits concrets, des verbes simples |

Le contrôle automatique en repère une bonne partie (tics d'animation et formules creuses), l'agent critique repère le reste.

## Dépenser moins de tokens

- Valide le look sur images fixes avant d'animer : un tour de plus sur les images fixes coûte bien moins cher qu'un tour sur la vidéo.
- Pendant les essais, `/umd:render draft` : demi-résolution, 15 images/s.
- `/umd:audit quick` entre deux itérations ; l'audit complet avant de livrer.
- Mets `"audit_model": "sonnet"` dans `.motion/project.json` pour les auditeurs.
- Note cible 7 pour un contenu courant, 8 pour une pub, 9 seulement si ça vaut des tours en plus.
- Regarde `/umd:tokens` après chaque grosse étape.

## Essai réel en 20 minutes

Pour vérifier que tout fonctionne chez toi, de bout en bout :

1. Dans un **nouveau** dossier, ouvre une **nouvelle** session Claude Code et installe le plugin (page [Installation](site:installation)).
2. `/umd:doctor` : tout doit être prêt, sinon accepte l'installation proposée.
3. `/umd:go un logo animé de 4 s pour un café fictif appelé Brûlerie, ambiance chaleureuse, avec une signature sonore`.
4. À l'étape des images fixes, regarde-les et valide-les.
5. Laisse `/umd:go` enchaîner jusqu'à l'audit, puis lis `.motion/AUDIT.md`.
6. `/umd:tokens` pour voir ce que chaque étape a coûté.

Si une étape bloque, copie le message d'erreur et le résultat de `node <plugin>/scripts/umd.mjs next`, et ouvre une issue sur [GitHub](https://github.com/1AngelMicka/ultimate-motion-design/issues).
