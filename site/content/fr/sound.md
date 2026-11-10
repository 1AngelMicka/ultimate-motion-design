# Son et musique

Un film de motion design se juge autant à l'oreille qu'à l'œil. Le plugin traite le son comme l'image : écrit dans le storyboard, calé sur les événements à l'image, mesuré, et avec une licence pour chaque fichier.

## Les quatre couches

- **La voix** porte le message ; le mix vise −16 à −14 LUFS, voix devant.
- **La musique** donne l'énergie et le rythme des coupes ; elle baisse d'environ 9 dB sous la voix et finit sur le carton final (`umd mix --backtime`).
- **Les effets** rendent les événements physiques : une arrivée, un clic, une révélation. Deux à cinq moments marqués par tranche de 30 s, pas un son par mouvement.
- **L'ambiance de pièce** est un souffle très bas, pour qu'un silence ne sonne jamais comme une coupure.

## Écouter la palette

`umd sfx <type>` fabrique ces sons avec FFmpeg : pas de téléchargement, pas de licence à suivre, toujours le même fichier pour les mêmes réglages. Varie `--dur`, `--seed` et `--gain` pour qu'un son répété ne sonne pas comme une banque.

@@SFX@@

## Quel son sur quel événement

| À l'image | Son | Calage |
| --- | --- | --- |
| Un élément glisse ou entre | `swipe` ou `whoosh` | Démarre 2 à 4 images avant, culmine à l'arrivée |
| Montée vers une révélation | `riser` | Finit pile sur l'image de la révélation |
| Moment fort, logo qui se pose | `impact` + `subdrop` | Attaque 0 à 1 image après l'image |
| Traîne après la révélation | `shimmer` ou `chime` | Part avec l'impact, sonne sur le plan tenu |
| Clic de curseur, interrupteur | `click` | Sur l'image du clic |
| Icône ou badge qui apparaît | `pop` | Sur la première image visible |
| Compteur qui défile | `tick` | Un par pas, jusqu'à 12 par seconde |
| Coupure numérique | `glitch` | Sur la coupe |

Chaque son va dans la section `## Sound cues` du storyboard avec son temps ; `umd sync` vérifie qu'il tombe à ±45 ms de son image.

## Trouver des sons et de la musique libres

```bash
umd sounds whoosh --cc0 --max 3
```
```bash
umd sounds get <id>
```
```bash
umd sounds ambient --music --limit 5
```

`umd sounds` cherche dans Freesound et Wikimedia Commons (effets) ou Jamendo (musique) via Openverse, en ne gardant que le CC0, le CC BY et le domaine public. `get` télécharge le fichier en WAV 48 kHz et inscrit l'auteur, la licence et la ligne de crédit dans `.motion/assets.lock.json`. Pour la musique en CC BY, la ligne de crédit va dans la description ou le générique : `umd licenses` les liste.

Pour une musique sur mesure : ACE-Step 1.5 (MIT) en local, ou une partition MIDI écrite par Claude et rendue avec FluidSynth. Jamais de musique du top, de piste extraite d'une plateforme vidéo, ni de licence « non commerciale ».

## Selon le type de projet

| Projet | Musique | Effets |
| --- | --- | --- |
| Promo, lancement | Mène le montage, coupes sur les temps | Impacts sur les révélations, un riser avant le moment fort |
| Présentation, explainer | Nappe calme sous la voix | Peu : clics, pops, ticks sur les changements d'étape |
| Short vertical | Accroche dès la première demi-seconde | Peu et francs ; les sous-titres portent le message en muet |
| Animation de logo | Une signature de 2 à 8 s | Riser, impact, traîne qui sonne sur le logo tenu |
| Court métrage | Partition avec des silences | Bruitages et ambiances par lieu |
| Page web | Aucune par défaut | Sons d'interface courts, coupés tant que l'utilisateur ne les active pas |
| Plan 3D | Soutient la matière | Bruitages qui collent au matériau : verre, métal, plastique |

Le guide complet, pour l'agent : `references/audio/sound-design.md`.
