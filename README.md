# Ultimate Motion Design

**Français** · [English](README.en.md)

Un plugin pour [Claude Code](https://claude.com/claude-code) qui fait produire à Claude du motion design de très haute qualité, puis le vérifie image par image avant de le livrer. Il couvre :

- les vidéos promo et les lancements produit ;
- les vidéos de présentation et les explainers ;
- les shorts verticaux pour les réseaux ;
- les animations de logo ;
- les courts métrages animés ;
- les pages web animées et les plans 3D.

Ses points forts :

- **Toutes les technos, une seule méthode.**
  - Moteurs : HTML/CSS, GSAP, Motion, Remotion, HyperFrames, Revideo, three.js et WebGPU, shaders, Lottie, Rive, SVG, canvas, Manim, Blender, Mermaid, Code Hike, VHS.
  - Son et texte : voix off, musique, effets sonores et sous-titres.
  - Claude choisit la bonne route pour chaque projet.
- **Rendu déterministe intégré.** `umd capture` transforme n'importe quelle page HTML animée en vidéo, image par image, sans licence Remotion. Deux rendus donnent des images strictement identiques.
- **Un vrai contrôle qualité.**
  - 12 domaines et 58 vérifications, de la narration aux licences.
  - Chaque vérification réussie a une preuve : une image à t = 2,40 s, une mesure en LUFS ou une ligne de code.
  - Note sur 10. Un point bloquant ouvert plafonne la note et bloque la livraison.
- **Économe et transparent sur les tokens.**
  - Environ 250 tokens chargés en permanence.
  - Les vérifications mesurables sont faites par le code, sans agent.
  - Une planche contact remplace des dizaines d'images.
  - `/umd:tokens` montre ce que chaque commande a consommé. Voir [Économie de tokens](#économie-de-tokens).
- **Licences sous contrôle.**
  - Un garde-fou refuse d'installer un modèle non commercial dans un projet commercial, un modèle Tencent en Europe, ou du code AGPL dans une page web.
  - Chaque asset est inventorié avec sa licence.
- **Facile à installer.** Deux commandes, puis `/umd:doctor` installe ce qui manque.
- **Gratuit, open source, sans télémétrie**, en français et en anglais.

## Le principe

```
/umd:kickoff → /umd:storyboard → /umd:build → /umd:render → /umd:audit → /umd:fix → /umd:deliver
```

| Étape | Ce qui se passe | Ce qui est produit |
| --- | --- | --- |
| `/umd:kickoff` | Claude regarde le dossier et pose quelques questions : quoi, format, durée, look, usage commercial. Il choisit le profil, la route et le moteur, vérifie les outils et écrit le brief. | `BRIEF.md`, `.motion/project.json` |
| `/umd:storyboard` | Script, puis découpage en beats minutés, avec une intention par beat. Avant toute animation, les **images fixes clés** sont rendues, comparées à la référence et corrigées en 3 tours au plus par un agent « directeur artistique ». | `.motion/storyboard.md`, `.motion/stills/` |
| `/umd:build` | Construction beat par beat avec les tokens de mouvement, les assets, la voix, la musique et les sous-titres. Des brouillons rapides (demi-taille, 15 images/s) sont relus par le même agent. | les sources de la pièce, `.motion/assets.lock.json` |
| Pendant que tu travailles | Le skill `motion` applique les règles de métier tout seul. Le temps vient de l'image, jamais de l'horloge. Les durées et les courbes viennent des tokens, et chaque mouvement a un rôle. Aucun tic de motion IA, rien de figé. Le garde-fou de licences surveille les installations. | |
| `/umd:render` | Rendu final, fait deux fois pour prouver qu'il est reproductible, puis analysé : coupes, temps morts, images figées, images noires, flashs, loudness, planche contact. | `.motion/renders/<id>/` |
| `/umd:audit` | Les mesures automatiques sont faites dans le code. Ensuite, un auditeur par groupe juge en parallèle ce qui demande un œil. Résultat : la note globale, la note de chaque domaine, l'évolution et les correctifs par priorité. | `.motion/AUDIT.md` |
| `/umd:fix` | Corrige les problèmes dans l'ordre, les points bloquants d'abord. Chaque correction est vérifiée, puis le rendu et l'audit sont refaits. | |
| `/umd:deliver` | Copie le rendu audité dans `deliverables/` avec un manifeste et les crédits. Refusé tant qu'un point bloquant est ouvert ou si le rendu a changé depuis l'audit. | `deliverables/` |

## Installation

**Il te faut :** [Claude Code](https://claude.com/claude-code), [Node.js](https://nodejs.org) 18 ou plus récent, `git` et [FFmpeg](https://ffmpeg.org). Sous Windows et macOS, `/umd:doctor` installe FFmpeg pour toi.

**1. Ajoute la marketplace et installe le plugin.** Dans Claude Code, tape :

```
/plugin marketplace add 1AngelMicka/ultimate-motion-design
```
```
/plugin install umd@ultimate-motion-design
```

**2. Redémarre Claude Code** (ou tape `/reload-plugins`), ouvre le dossier de ton projet et lance :

```
/umd:doctor
```

Il vérifie Node, FFmpeg et les filtres dont il a besoin, Playwright et Chromium, ainsi que les outils de ta route (Blender, Manim, Python…). Avec ton accord, il installe ce qui manque :

- **Playwright et Chromium** vont dans `~/.umd/runtime`, partagé par tous tes projets ; rien n'est ajouté à ton projet ;
- **FFmpeg** passe par winget (Windows) ou Homebrew (macOS). Sous Linux, il te donne la commande `apt`.

**3. Lance ton premier projet :**

```
/umd:kickoff une vidéo de lancement de 30 s pour notre app, format 16:9
```

**4. Facultatif, selon ta route :** les skills officiels et serveurs MCP utiles. Voir [Outils compagnons](#outils-compagnons) ; `/umd:kickoff` propose ceux qui servent à ton projet.

### Installer pour toute une équipe

Dans le dossier du projet, lance une fois dans ton terminal, puis commite `.claude/settings.json` :

```bash
claude plugin marketplace add 1AngelMicka/ultimate-motion-design --scope project
```
```bash
claude plugin install umd@ultimate-motion-design --scope project
```

Tes collègues reçoivent le plugin en ouvrant le projet dans Claude Code et en faisant confiance au dossier. Chacun lance `/umd:doctor` une fois sur sa machine.

### Mettre à jour

Tape `/plugin marketplace update ultimate-motion-design` dans Claude Code. Pour les mises à jour automatiques : `/plugin` → **Marketplaces** → **ultimate-motion-design** → **Enable auto-update**.

### Désinstaller

```
/plugin uninstall umd@ultimate-motion-design
```
```
/plugin marketplace remove ultimate-motion-design
```

Ton projet garde son dossier `.motion/` et ses livrables ; supprime-les si tu n'en veux plus. Le runtime Playwright partagé se trouve dans `~/.umd/runtime`.

## Commandes

| Commande | Pour |
| --- | --- |
| `/umd:kickoff [ce que tu veux faire]` | Configurer ou mettre à jour le projet : brief, profil, format, route, moteur, politique de licences, outils |
| `/umd:storyboard [notes]` | Écrire le découpage et valider le look sur images fixes avant d'animer |
| `/umd:build [beats ou notes]` | Construire la pièce, avec des brouillons relus jusqu'à 3 tours |
| `/umd:render` · `/umd:render draft` | Rendu final, fait deux fois pour prouver le déterminisme, puis analysé · brouillon rapide |
| `/umd:audit` | Audit incrémental : seul ce qu'un changement peut affecter est revérifié. Il est complet au premier audit, après une mise à jour du plugin, ou si le dernier audit complet a plus de 30 jours |
| `/umd:audit quick` | Vérifications automatiques seulement, sans agent : le moins cher |
| `/umd:audit full` | Tout revérifier depuis zéro |
| `/umd:audit story` | Un seul groupe : `story`, `motion`, `sound` ou `delivery` |
| `/umd:audit TXT` · `/umd:audit TXT-01 SAF-01` · `/umd:audit blockers` | Un domaine, des vérifications précises, ou seulement les points bloquants |
| `/umd:fix` · `/umd:fix blockers` · `/umd:fix AUD-01` | Corriger par priorité (bloquants puis majeurs), seulement les bloquants, ou un problème précis |
| `/umd:deliver [nom]` | Livrer le rendu audité, puis les versions par plateforme demandées |
| `/umd:tokens [jours]` | Consommation de tokens par commande, et le conseil qui ferait le plus économiser |
| `/umd:doctor` · `/umd:doctor fix` | Vérifier ou installer les outils |
| `/umd:handoff` | Écrire `.motion/handoff.md` pour reprendre dans une autre session |

Toutes ces commandes s'appuient sur une CLI sans dépendance, que tu peux aussi lancer toi-même : `node <plugin>/scripts/umd.mjs` (sans argument, elle affiche son aide). On y trouve notamment `capture`, `still`, `analyze`, `frames`, `compare`, `vmaf`, `mix`, `normalize`, `captions`, `burn`, `lint`, `licenses`, `webperf` et `tokens`.

## Routes et technos

Au kickoff, Claude choisit une route selon ce que tu fais. Chaque route a son guide pas à pas, chargé seulement quand il sert.

| Route | Pour | Moteurs |
| --- | --- | --- |
| `html-video` (par défaut) | Promo, présentation, explainer graphique, short, logo, typographie animée | HTML/CSS, GSAP, canvas rendus par `umd capture` ; HyperFrames ; Remotion ; Revideo |
| `threejs-film` | Un personnage ou un objet dans un petit monde 3D | three.js ou WebGPU dans un seul fichier HTML, corrigé plan par plan |
| `blender` | Matériaux réels, personnages riggés, rendus produit | Blender piloté en Python et par son serveur MCP, BlenderKit |
| `director` | Histoire racontée, nombreuses scènes, images et voix générées | Claude réalise, d'autres modèles dessinent et parlent, sous un registre de licences strict |
| `explainer` | Maths, schémas, code, terminal | Manim, Mermaid, D2, Code Hike, VHS |
| `web-page` | Site, landing page, interface | GSAP, Motion, CSS, View Transitions, Lenis, registres shadcn animés |

S'y ajoutent :

- **14 recettes éprouvées :** lancement produit, démo produit, vidéo de présentation, explainer, logo animé, typographie cinétique, short vertical, data story, section hero, transitions de page, scrollytelling, micro-interactions, court métrage narratif, et reproduire une animation de référence ;
- **16 guides de moteur ;**
- **des guides de métier :** principes d'animation, tokens de mouvement, composition et zones sûres, texte à l'écran, anti-« AI slop » ;
- **des guides audio :** voix commercialisables, musique et effets sonores, mixage, sous-titres ;
- **des guides pratiques :** assets, spécifications par plateforme, licences.

Le fichier [catalogue_motion_design_claude_codex_2026.md](catalogue_motion_design_claude_codex_2026.md) recense **1 073 dépôts GitHub** vérifiés le 9 novembre 2026, avec des alertes de licence.

### Le rendu déterministe

`umd capture` ouvre ta page dans Chromium (par Playwright), sur un petit serveur local. Avant que le moindre script de la page tourne, il remplace par un **temps virtuel** :

- l'horloge (`Date`, `performance.now`) ;
- `requestAnimationFrame` et les minuteurs ;
- `Math.random`, rendu reproductible par une graine.

À chaque image, il met en pause et place au bon instant toutes les animations CSS et Web Animations, ainsi que les éléments `<video>`. Les bibliothèques pilotées par `requestAnimationFrame` (GSAP, three.js, Lottie, p5…) avancent d'un pas par image. FFmpeg encode ensuite les captures. Tu peux aussi définir `window.umdRender(t)` pour tout contrôler toi-même. Vérifié sur une scène GSAP et three.js : deux rendus donnent des images identiques à l'octet près.

## Ce qu'il vérifie

| Groupe | Domaines |
| --- | --- |
| Histoire | NAR brief et narration · TIM rythme et timing · LIF vie et densité · ART direction artistique |
| Mouvement | MOT easing et chorégraphie · TXT texte à l'écran · SAF sécurité du mouvement · WEB pages web animées |
| Son | AUD audio · CAP sous-titres |
| Livraison | REN rendu et encodage · LIC licences et droits |

Les règles et les vérifications sont détaillées dans [docs/fr/REFERENTIEL.md](docs/fr/REFERENTIEL.md).

27 des 58 vérifications sont mesurées par le code, sans agent (celles qui s'appliquent dépendent du profil) :

- durée et format de sortie ;
- images figées et temps morts ;
- images noires ;
- flashs, en approximation plein cadre de WCAG 2.3.1 ;
- loudness et crête vraie ;
- silences et coupure brutale du son ;
- reproductibilité du rendu, et fidélité de l'encodage livré au master (VMAF) ;
- couverture, synchronisation et vitesse de lecture des sous-titres ;
- pour les pages : fluidité, CLS et respect de `prefers-reduced-motion` ;
- dans le code : durées codées en dur, tics de motion IA, polices et assets distants, formules creuses ;
- inventaire et licences des assets.

Les autres vérifications sont jugées par les auditeurs, à partir de la planche contact et de quelques images ciblées.

### Notation

- Chaque vérification est **bloquante** (5 points), **majeure** (3) ou **mineure** (1). Réussie = tous les points, partielle = la moitié, en échec ou non vérifiée = aucun.
- Un point bloquant en échec plafonne son domaine à 3/10 et la note globale à 5,9/10. Exemples :
  - un flash dangereux ;
  - un texte trop court pour être lu ;
  - un rendu non reproductible ;
  - des images fixes non validées avant l'animation ;
  - un asset non commercial dans une pub.
- La note globale pondère les domaines selon le profil : `promo`, `presentation`, `explainer`, `social`, `film`, `logo` ou `web`. Les domaines sans objet sont ignorés, comme les sous-titres d'un logo ou l'audio d'une page web.
- Les seuils se règlent par projet dans `thresholds` de `.motion/project.json` : −14 LUFS, 3 flashs par seconde, 3 s de temps mort, VMAF 93… Seuls −14 LUFS (convention des plateformes de streaming) et la limite de 3 flashs par seconde (WCAG) reposent sur une référence publiée ; les autres sont des conventions à ajuster sur tes rendus.

## Licences et droits

Les licences sont le risque le plus concret d'un projet motion : beaucoup de modèles « état de l'art » ont des poids non commerciaux. Le plugin les traite à trois niveaux :

- **Au kickoff**, la politique du projet est écrite dans `license_policy` : usage commercial ou non, région, statut Remotion (gratuit jusqu'à 3 salariés, licence entreprise payante au-delà), exceptions acceptées.
- **Pendant le travail**, un hook refuse l'installation (npm, pnpm, yarn, bun, pip, uv, pipx, poetry) d'un paquet ou d'un modèle interdit par cette politique, en proposant une alternative. Le registre compte 30 entrées :
  - les poids non commerciaux de F5-TTS, MusicGen, YuE, FLUX.1 [dev]… ;
  - les modèles Tencent Hunyuan, dont la licence ne s'applique pas en Europe ;
  - l'AGPL et la GPL ;
  - la Commons Clause d'Animate UI ;
  - les dépôts sans licence.
- **À l'audit**, `umd licenses` croise les dépendances, les modèles déclarés et `.motion/assets.lock.json`. Chaque asset y est inscrit avec sa source et sa licence ; les crédits obligatoires sont copiés dans `deliverables/credits.txt`.

Une exception reste possible : c'est ta décision, inscrite noir sur blanc dans `license_policy.allow`.

## Économie de tokens

Le plugin réduit les tokens à trois endroits :

- **ce qui est chargé en permanence** : le moins possible ;
- **ce que Claude lit** : des résumés JSON, une planche contact et des images ciblées plutôt que des sorties brutes et des dizaines d'images ;
- **ce qui est refait** : seul ce qui a changé est revérifié, et le projet n'est pas réexploré à chaque session.

### Ce que le plugin fait tout seul

| Mécanisme | Effet |
| --- | --- |
| **Presque rien en permanence** | Environ 250 tokens chargés en permanence : la description du skill `motion` et celles des deux agents. Les dix commandes `/umd:*` ne coûtent rien tant qu'on ne les lance pas. Dans un projet umd, le hook de démarrage ajoute environ 150 tokens de contexte. |
| **Références à la demande** | 49 guides de 1 200 à 2 100 tokens chacun, lus un par un, seulement quand ils servent : par exemple la route du projet, puis le guide de son moteur. |
| **Vérifications faites par le code** | 27 vérifications sur 58 sont décidées par la CLI à partir des mesures FFmpeg, du lint, des licences et des tests navigateur. Les auditeurs ne regardent que ce qui demande un œil. |
| **Planche contact** | Chaque rendu produit une planche de 16 images, soit une seule image à lire. Claude n'extrait ensuite que 2 à 6 images ciblées si un doute reste. |
| **Sorties compactes** | Rendus, encodages et analyses écrivent leur sortie complète sur le disque et ne renvoient qu'un résumé. Sur notre test, 3 commandes passent d'environ 3 700 tokens de sortie à environ 700. |
| **Audit incrémental par défaut** | Seules les vérifications qu'un fichier modifié ou un nouveau rendu peut affecter sont revérifiées. Si rien n'a changé, aucun auditeur n'est lancé. |
| **Mode rapide** (`/umd:audit quick`) | Seulement les mesures automatiques, sans agent. |
| **Brouillons** (`/umd:render draft`) | Demi-résolution à 15 images/s pendant l'itération. |
| **Modèle moins cher pour les auditeurs** | `"audit_model": "sonnet"` dans `.motion/project.json` ; ta session reste sur ton modèle habituel. |
| **Passage de relais** (`/umd:handoff`) | Une note courte permet à la session suivante de reprendre sans réexplorer. Le hook de démarrage la signale pendant 14 jours. |

### Transparence

- `/umd:tokens` lit les transcriptions locales de Claude Code pour ce dossier, sous-agents compris. Pour chaque commande `/umd:*`, il affiche les tokens en entrée, en sortie, en écriture et en lecture de cache. Il ajoute le conseil qui ferait le plus économiser sur ton projet.
- Avec un `token_budget` dans `.motion/project.json`, il affiche la part du budget utilisée.
- Le rapport d'audit indique aussi les tokens évités grâce aux sorties compactes.

### Selon la pièce

| Pièce | Coût typique | Pour dépenser moins |
| --- | --- | --- |
| **Courte** (logo, micro-interaction, 2 à 10 s) | Faible : peu de beats, une planche suffit | `/umd:audit quick` pendant les itérations, un audit complet avant livraison |
| **Moyenne** (promo, présentation, short, 15 à 90 s) | Moyen : le storyboard et les brouillons dominent | Valider le look sur images fixes avant d'animer, 2 tours de brouillon, auditeurs sur Sonnet |
| **Longue** (film narratif, explainer de plusieurs minutes, route `director`) | Élevé : beaucoup de scènes, d'assets et de relectures | Travailler par séquence (`/umd:build 1-6`), audits par groupe, `/umd:handoff` à chaque fin de session |

## Outils compagnons

Ces outils ne sont pas inclus dans le plugin : ce sont des projets séparés, installés à part. `/umd:kickoff` propose ceux qui conviennent à ta route et ne les installe qu'avec ton accord. Les skills ne coûtent presque rien tant qu'ils ne servent pas. Un serveur MCP, lui, ajoute ses outils à chaque session : installe-le au niveau du projet, seulement pour la route qui en a besoin.

| Outil | Quand | Ce qu'il apporte |
| --- | --- | --- |
| [remotion-dev/skills](https://github.com/remotion-dev/skills) | Route avec Remotion | Bonnes pratiques Remotion. Pense à la licence Remotion |
| [greensock/gsap-skills](https://github.com/greensock/gsap-skills) | Pages ou scènes animées avec GSAP | Timelines, ScrollTrigger, plugins |
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | Route avec HyperFrames | Skills et CLI HTML → vidéo |
| [LottieFiles/motion-design-skill](https://github.com/LottieFiles/motion-design-skill) | Toutes les routes | Principes de timing, d'easing et de chorégraphie |
| [kylezantos/design-motion-principles](https://github.com/kylezantos/design-motion-principles) | Interfaces et pages animées | Mode audit et liste anti-tics IA |
| [blader/humanizer](https://github.com/blader/humanizer) | Pièces avec voix off ou beaucoup de texte | Retire les tournures IA des scripts et des sous-titres |
| [elevenlabs/skills](https://github.com/elevenlabs/skills) | Si tu acceptes une voix en ligne payante | Voix, effets sonores, musique |
| [rive-app/skills](https://github.com/rive-app/skills) · [splinetool/spline-skills](https://github.com/splinetool/spline-skills) | Animation vectorielle interactive · 3D éditable | Skills officiels Rive et Spline |
| [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) | Débogage de pages animées | Traces de performance, images perdues |
| [ahujasid/mcp-for-blender](https://github.com/ahujasid/mcp-for-blender) | Route `blender` uniquement | Pilote un Blender ouvert |
| [NiazMorshed2007/reanimate](https://github.com/NiazMorshed2007/reanimate) | Une animation de référence à étudier (site, vidéo, GIF, Lottie, WebGL), ou ta propre animation à porter | La filme, en tire les durées et les courbes, la reconstruit et mesure l'écart image par image. Demande Bun ; testé sur macOS et Linux seulement. Voir [la recette](plugins/umd/references/recipes/match-reference.md) |

Les commandes d'installation exactes, vérifiées dans chaque projet, sont dans [references/companions.md](plugins/umd/references/companions.md).

## Ce qu'il crée dans ton projet

```
BRIEF.md                         le brief (écrit par /umd:kickoff)
.motion/
  project.json                   profil, route, moteur, format, rendu, politique de licences, seuils
  storyboard.md                  les beats, et la ligne « Stills validated » datée
  motion-tokens.json             durées et courbes (format DTCG)
  assets.lock.json               chaque asset avec sa source et sa licence
  stills/                        les images fixes clés
  renders/<id>/                  vidéo, render.json, analysis.json, sheet.jpg, determinism.json, logs
  renders/latest.json            le dernier rendu
  AUDIT.md                       le dernier rapport d'audit
  audits/<date>.json             chaque audit, pour suivre la note dans le temps
  audits/<date>/                 evidence.json, plan.json, parts/ (résultats des auditeurs)
  token-savings.json             tokens évités par les sorties compactes
  handoff.md                     le passage de relais entre sessions
deliverables/                    livrables, avec leur manifeste et credits.txt
```

Commite `BRIEF.md` et `.motion/`, sauf les rendus, pour garder l'historique des notes. `/umd:kickoff` ajoute à ton `.gitignore` les rendus, les logs d'audit et le compteur de tokens.

## En cas de problème

| Problème | Solution |
| --- | --- |
| Les commandes `/umd:...` n'apparaissent pas | Redémarre Claude Code ou tape `/reload-plugins`. Regarde `/plugin` → **Installed** et l'onglet **Errors**. |
| `node: command not found` | Installe Node.js 18+ et vérifie que `node` est dans ton PATH. |
| L'ajout de la marketplace échoue | Vérifie que `git` est installé. Sans clé SSH GitHub, définis `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` et réessaie. |
| `ffmpeg not found` | Lance `/umd:doctor`. Après une installation par winget ou Homebrew, ouvre un nouveau terminal pour que le PATH soit relu. Tu peux aussi indiquer le chemin des binaires avec `UMD_FFMPEG` et `UMD_FFPROBE`. |
| `Playwright not found` ou `Chromium is not installed` | `/umd:doctor fix` installe les deux dans `~/.umd/runtime`. |
| `Unknown duration` au rendu | Définis `window.umdDuration` (en secondes) dans la page, ou `duration_s` dans `.motion/project.json`. |
| Le rendu n'est pas reproductible (REN-01) | Une source de hasard échappe au temps virtuel : données réseau, horodatage serveur, WebGPU, police chargée en ligne. Le guide du moteur (`references/engines/`) liste les règles. Pilote la scène par `window.umdRender(t)`. |
| La 3D est lente ou vide dans le rendu | Chromium sans interface utilise un rendu logiciel. Itère avec `/umd:render draft` et vérifie d'abord une image avec `umd still`. |
| Une installation est bloquée par le garde-fou | Prends l'alternative proposée (`references/licenses.md`). Si tu acceptes le risque, ajoute le nom à `license_policy.allow` : c'est ta décision, Claude ne le fait pas à ta place. |
| `/umd:deliver` refuse de livrer | Un point bloquant est ouvert, ou le rendu a changé depuis l'audit : `/umd:fix`, puis `/umd:render` et `/umd:audit`. |
| `/umd:tokens` est vide | Les transcriptions apparaissent après la première session Claude Code dans ce dossier. Si tu as déplacé ta configuration, définis `CLAUDE_CONFIG_DIR`. |

## Confidentialité et sécurité

Le plugin n'envoie aucune télémétrie.

- **Ce qu'il contacte :**
  - Pendant un rendu, il sert tes fichiers sur `127.0.0.1` et ne contacte que les URL que ta page charge elle-même.
  - `/umd:doctor fix` télécharge Playwright depuis npm, Chromium depuis les serveurs de Playwright, et FFmpeg par winget ou Homebrew.
- **Ce qu'il lit :** `/umd:tokens` lit les transcriptions de Claude Code sur ta machine et n'en envoie rien.
- **Hooks :** ils tournent en local et sont assez courts pour être relus : [garde-fou de licences](plugins/umd/scripts/hooks/license-guard.mjs), [rappel de session](plugins/umd/scripts/hooks/session-start.mjs).
- **Signaler une faille :** voir [SECURITY.md](SECURITY.md).

Le plugin aide à repérer les pièges de licence ; il ne remplace pas l'avis d'un juriste.

## Contribuer

Idées, bugs, nouvelles recettes et nouveaux moteurs sont les bienvenus : voir [CONTRIBUTING.md](CONTRIBUTING.md). Prévus :

- calibrer les seuils sur de vrais rendus ;
- un module After Effects et Premiere par MCP ;
- des exports par plateforme automatisés ;
- un juge visuel spécialisé dans le timing.

## Crédits et licence

La mécanique de notation, d'audit et d'économie de tokens vient de [quality-pack](https://github.com/1AngelMicka/quality-pack), du même auteur. Le catalogue et les guides s'appuient sur l'étude de plus de 900 dépôts. Les outils tiers sont crédités dans [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Licence MIT.
