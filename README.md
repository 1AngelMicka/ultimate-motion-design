# Ultimate Motion Design

**Français** · [English](README.en.md)

Un plugin pour [Claude Code](https://claude.com/claude-code) qui fait produire à Claude du motion design de très haute qualité : vidéos promo, vidéos de présentation, explainers, shorts verticaux, animations de logo, courts métrages animés, pages web animées et plans 3D. Il vérifie lui-même le résultat, image par image, avant de livrer.

- **Toutes les technos, une seule méthode.** HTML/CSS, GSAP, Motion, Remotion, HyperFrames, Revideo, three.js et WebGPU, shaders, Lottie, Rive, SVG, canvas, Manim, Blender, Mermaid, Code Hike, VHS. Voix, musique, effets sonores et sous-titres sont gérés aussi. Claude choisit la bonne route pour chaque projet.
- **Rendu déterministe intégré.** `umd capture` transforme n'importe quelle page HTML animée en vidéo, image par image, sans licence Remotion. Deux rendus donnent des images strictement identiques.
- **Un vrai contrôle qualité.** 12 domaines et 58 critères : narration, rythme, vie, direction artistique, easing, texte, sécurité, web, audio, sous-titres, rendu et licences. Chaque critère réussi a une preuve : une image à t = 2,40 s, une mesure LUFS ou une ligne de code. La note est sur 10 ; un point bloquant ouvert la plafonne et bloque la livraison.
- **Économe et transparent sur les tokens.** Les critères mesurables sont décidés dans le code, sans agent. L'audit est incrémental, les sorties de commandes sont compactes et une planche contact remplace des dizaines d'images. `/umd:tokens` montre ce que chaque commande a consommé.
- **Licences sous contrôle.** Un garde-fou refuse d'installer un modèle non commercial dans un projet commercial, un modèle Tencent en UE ou du code AGPL dans une page web. Chaque asset est inventorié avec sa licence.
- **Facile à installer.** Deux commandes, puis `/umd:doctor` installe ce qui manque.
- Gratuit, open source (MIT), sans télémétrie, en français et en anglais.

## Le principe

```
/umd:kickoff → /umd:storyboard → /umd:build → /umd:render → /umd:audit → /umd:fix → /umd:deliver
```

| Commande | Ce qui se passe | Livrable |
| --- | --- | --- |
| `/umd:kickoff` | Quelques questions (quoi, format, durée, look, usage). Claude choisit le profil, la route et le moteur, vérifie les outils et écrit le brief. | `BRIEF.md`, `.motion/project.json` |
| `/umd:storyboard` | Script, beats minutés avec une intention chacun, puis **images fixes clés** comparées à la référence et corrigées jusqu'à 3 tours avant d'animer. | `.motion/storyboard.md`, `.motion/stills/` |
| `/umd:build` | Construction plan par plan avec les tokens de mouvement, les assets, la voix, la musique et les sous-titres, avec des brouillons rapides relus par un agent « directeur ». | le projet source, `assets.lock.json` |
| `/umd:render` | Rendu final, fait deux fois pour prouver qu'il est reproductible, puis analysé : coupes, temps morts, images figées, flashs, loudness et planche contact. | `.motion/renders/<id>/` |
| `/umd:audit` | Mesures automatiques et auditeurs parallèles sur ce qui demande un œil. Note sur 10 et correctifs par priorité. | `.motion/AUDIT.md` |
| `/umd:fix` | Corrige par priorité, vérifie chaque correction, refait le rendu et l'audit. | |
| `/umd:deliver` | Copie le rendu audité dans `deliverables/` avec manifeste et crédits. Refusé tant qu'un point bloquant est ouvert. | `deliverables/` |
| `/umd:tokens` | Consommation de tokens par commande et conseils pour dépenser moins. | |
| `/umd:doctor` | Vérifie et installe FFmpeg, Playwright, Chromium et les outils de la route. | |
| `/umd:handoff` | Note de passation pour reprendre dans une autre session. | `.motion/handoff.md` |

Pendant que Claude construit, le skill `motion` applique les règles de métier tout seul. Le temps vient de l'image, jamais de l'horloge. Durées et courbes viennent des tokens. Chaque mouvement a un rôle. Aucun tic de motion IA (points qui pulsent, flou à chaque entrée, ressorts partout). Il se passe quelque chose de nouveau toutes les 2 secondes environ, et rien n'est jamais totalement figé.

## Installation

**Il te faut :** [Claude Code](https://claude.com/claude-code), [Node.js](https://nodejs.org) 18 ou plus récent et FFmpeg. `/umd:doctor` installe FFmpeg pour toi sous Windows (winget) et macOS (Homebrew).

**1. Dans Claude Code, ajoute la marketplace et installe le plugin :**

```
/plugin marketplace add 1AngelMicka/ultimate-motion-design
```
```
/plugin install umd@ultimate-motion-design
```

**2. Redémarre Claude Code** (ou tape `/reload-plugins`), ouvre un dossier de projet et lance :

```
/umd:doctor
```

Il vérifie Node, FFmpeg (et ses filtres), Playwright et Chromium. Avec ton accord, il installe ce qui manque. Playwright et Chromium vont dans `~/.umd/runtime` : rien n'est ajouté à ton projet.

**3. Commence :**

```
/umd:kickoff une vidéo de lancement de 30 s pour notre app, format 16:9
```

### Installer pour toute une équipe

Dans le dossier du projet, lance une fois dans ton terminal, puis commite `.claude/settings.json` :

```bash
claude plugin marketplace add 1AngelMicka/ultimate-motion-design --scope project
```
```bash
claude plugin install umd@ultimate-motion-design --scope project
```

### Mettre à jour

`/plugin marketplace update ultimate-motion-design`, ou dans `/plugin` → **Marketplaces** → **ultimate-motion-design** → **Enable auto-update**.

## Routes et technos

Au kickoff, Claude choisit une route selon ce que tu fais. Chaque route a un guide pas à pas, chargé seulement quand il sert.

| Route | Pour | Moteurs |
| --- | --- | --- |
| `html-video` (par défaut) | Promo, présentation, explainer graphique, social, logo, typographie animée | HTML/CSS, GSAP, canvas rendus par `umd capture` ; HyperFrames ; Remotion ; Revideo |
| `threejs-film` | Un personnage ou un objet dans un petit monde 3D | three.js / WebGPU dans un seul fichier HTML, plan par plan |
| `blender` | Matériaux réels, personnages riggés, rendus produit | Blender en Python + serveur MCP Blender, BlenderKit |
| `director` | Histoire racontée, nombreuses scènes, images et voix générées | Claude réalise, d'autres modèles dessinent et parlent, avec un registre de licences strict |
| `explainer` | Maths, schémas, code, terminal | Manim, Mermaid, D2, Code Hike, VHS |
| `web-page` | Site, landing, interface | GSAP, Motion, CSS, View Transitions, Lenis, registres shadcn animés |

Il y a aussi 13 recettes éprouvées : lancement produit, démo produit, vidéo de présentation, explainer, logo animé, typographie cinétique, short vertical, data story, section hero, transitions de page, scrollytelling, micro-interactions et court métrage narratif. S'y ajoutent des guides pour l'audio (voix commercialisables, musique, mixage, sous-titres), les assets, les spécifications par plateforme et les licences.

Le fichier [catalogue_motion_design_claude_codex_2026.md](catalogue_motion_design_claude_codex_2026.md) recense **1 072 dépôts GitHub** vérifiés, avec leurs pièges de licence.

## Le contrôle qualité

| Groupe | Domaines |
| --- | --- |
| Histoire | NAR brief et narration · TIM rythme · LIF vie et densité · ART direction artistique |
| Mouvement | MOT easing et chorégraphie · TXT texte à l'écran · SAF sécurité (flashs) · WEB pages animées |
| Son | AUD audio · CAP sous-titres |
| Livraison | REN rendu et encodage · LIC licences |

- **7 profils** pondèrent les domaines : promo, présentation, explainer, social, film, logo, web.
- **Un critère non vérifié compte comme un échec.**
- **Un point bloquant en échec** plafonne son domaine à 3/10 et la note globale à 5,9 : un flash dangereux, un texte illisible, un rendu non reproductible ou un asset non commercial dans une pub.
- Le référentiel complet est dans [docs/fr/REFERENTIEL.md](docs/fr/REFERENTIEL.md).
- Les seuils (−14 LUFS, 3 flashs/s, 3 s de temps mort, VMAF 93…) se règlent par projet dans `thresholds`.

Mesures faites par le code, sans agent : durée, format, images figées, temps morts, images noires, flashs (approximation plein cadre de WCAG 2.3.1), loudness et crête vraie, silences, coupure brutale, déterminisme, VMAF, synchronisation et vitesse de lecture des sous-titres, fluidité, CLS et `prefers-reduced-motion` des pages, valeurs codées en dur, tics IA, polices distantes, licences.

## Économie de tokens

| Levier | Effet |
| --- | --- |
| Critères mesurables décidés dans le code | Les auditeurs ne regardent que ce qui demande un œil ; environ 40 % des critères sont tranchés sans agent |
| Planche contact de 16 images | Une seule image lue au lieu de dizaines, puis 2 à 6 images ciblées si besoin |
| Sorties compactes | Rendus, encodages et analyses écrivent leur sortie complète sur disque et renvoient un résumé. Les tokens évités sont comptés et affichés |
| Audit incrémental et mode `quick` | Seul ce qui a changé est revérifié ; `quick` n'utilise aucun agent |
| Références chargées à la demande | Une cinquantaine de guides, chacun lu seulement quand il sert ; les commandes ne coûtent rien tant qu'on ne les lance pas |
| Brouillons `--draft` | Demi-résolution à 15 images/s pendant l'itération |
| `audit_model` | Les auditeurs peuvent tourner sur un modèle moins cher (`"sonnet"`) |

`/umd:tokens` lit les transcriptions locales de Claude Code et affiche, pour chaque commande `/umd:*`, les tokens en entrée, en sortie et en cache. Il ajoute un conseil ciblé. Avec un `token_budget` dans `project.json`, il affiche la part utilisée.

## Structure

```
.claude-plugin/marketplace.json
plugins/umd/
  skills/        kickoff, storyboard, build, render, audit, fix, deliver, doctor, tokens, handoff, motion
  agents/        auditor (audit par groupe), critic (relecture de directeur)
  hooks/         SessionStart (contexte court), PreToolUse Bash (garde-fou de licences)
  referential/   scoring.json, domains/*.json, licenses.json, slop-words.json
  references/    routes/, recipes/, engines/, audio/, craft/, assets, licenses, companions, platforms
  scripts/       umd.mjs (CLI sans dépendance) et lib/
  templates/     project.json, BRIEF.md, storyboard.md, motion-tokens.json (DTCG), assets.lock.json
docs/            référentiel généré (fr, en)
tests/           node --test tests/
tools/           build.mjs (validation et génération), REFERENCE_GUIDE.md
```

Contribuer : voir [CONTRIBUTING.md](CONTRIBUTING.md). Licence : [MIT](LICENSE). Outils tiers : [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
