# Pour les agents IA

Tu peux confier l'installation et la prise en main à ton agent IA : donne-lui simplement le lien du dépôt. Tout ce dont il a besoin est écrit pour lui.

## La phrase à copier

```
Installe et configure ce plugin pour moi, puis guide-moi pour mon premier projet : https://github.com/1AngelMicka/ultimate-motion-design
```

## Ce que l'agent trouve

| Fichier | Pour |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Le guide écrit pour un agent : installation (deux voies), vérification, prise en main, règles à respecter |
| [llms.txt](https://1angelmicka.github.io/ultimate-motion-design/llms.txt) | Le résumé et le plan de la documentation, au format que lisent les agents |
| [llms-full.txt](https://1angelmicka.github.io/ultimate-motion-design/llms-full.txt) | Toute la documentation en un seul fichier texte, à lire d'une traite |

## Ce qu'il fera

1. Il te demandera de taper les deux commandes `/plugin` dans Claude Code. Un agent ne peut pas taper une commande slash à ta place. Autre possibilité : il écrit l'installation dans `.claude/settings.json` de ton projet, et tu n'as qu'à redémarrer Claude Code.
2. Il te fera lancer `/umd:doctor`, qui vérifie FFmpeg, Playwright et Chromium et propose de les installer.
3. Il t'expliquera `/umd:go`, la seule commande à retenir, et t'aidera à formuler ton premier brief.

Il ne doit jamais installer quelque chose au niveau du système sans te demander, ni ajouter une exception de licence ou baisser un seuil à ta place : ces décisions restent les tiennes.

## Avec un autre agent que Claude Code

Le plugin est fait pour Claude Code, mais son moteur est une CLI Node sans dépendance : n'importe quel agent peut s'en servir pour rendre une page HTML en vidéo, analyser une vidéo ou vérifier des licences. Les étapes de la méthode sont de simples fichiers Markdown, lisibles par tous. Le détail est dans [AGENTS.md](AGENTS.md).

**Le skill seul.** Le dossier [`skills/motion-design`](https://github.com/1AngelMicka/ultimate-motion-design/tree/main/skills/motion-design) est un skill autonome (un `SKILL.md` et ses 52 guides) : copie-le dans le dossier de skills de ton agent (`~/.claude/skills/`, `~/.codex/skills/`…), ou installe-le avec `npx skills add 1AngelMicka/ultimate-motion-design` en choisissant `motion-design`. Il apporte la méthode et le métier ; le plugin ajoute le rendu reproductible, l'audit noté et le garde-fou de licences.
