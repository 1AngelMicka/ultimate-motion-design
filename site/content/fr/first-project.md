# Premier projet

De l'installation à une vidéo livrée, avec une seule commande : `/umd:go`. Compte cinq minutes pour la mise en route, puis le temps du rendu.

## 1. Installer

Dans Claude Code :

```
/plugin marketplace add 1AngelMicka/ultimate-motion-design
/plugin install umd@ultimate-motion-design
```

Redémarre Claude Code (ou tape `/reload-plugins`), puis ouvre un dossier vide pour ton projet. Le détail, y compris pour une équipe, est sur la page [Installation](site:installation).

## 2. Dire ce que tu veux

```
/umd:go une vidéo de lancement de 30 s pour notre app de notes, format 16:9, ton sobre
```

`/umd:go` voit qu'il n'y a pas encore de projet et commence par le **kickoff** :

- il vérifie les outils (FFmpeg, Playwright, Chromium) et propose d'installer ce qui manque ;
- il te pose quelques questions : public, plateformes, look décrit en mots, voix off et musique, usage commercial ;
- il choisit le profil (ici `promo`), la route (`html-video`) et le moteur, en disant pourquoi ;
- il écrit `BRIEF.md` et `.motion/project.json`.

## 3. Valider le look avant d'animer

Tape `/umd:go` de nouveau. Il écrit le **storyboard** : des beats minutés, une intention par beat, du texte qui reste assez longtemps à l'écran. Puis il rend les **images fixes clés** et les fait relire par un agent « directeur artistique », qui corrige jusqu'à trois tours.

Il s'arrête alors pour te montrer les images. Si elles te plaisent, dis-le : il note la validation dans le storyboard. Sinon, dis ce qui ne va pas.

## 4. Laisser construire, rendre et vérifier

Encore `/umd:go`. Cette fois il enchaîne seul :

1. **build** : la pièce beat par beat, avec voix, musique et sous-titres si le brief en prévoit, et des brouillons rapides relus ;
2. **render** : le rendu final, fait deux fois pour prouver qu'il est reproductible, puis analysé ;
3. **audit** : les mesures automatiques, puis les auditeurs en parallèle, et une note sur 10 dans `.motion/AUDIT.md` ;
4. **fix** si un point bloquant reste ouvert, puis nouveau rendu et nouvel audit.

Il s'arrête quand il ne reste que des problèmes mineurs ou majeurs à arbitrer, ou quand tout est prêt.

## 5. Livrer

`/umd:go` propose la livraison : la vidéo auditée part dans `deliverables/` avec son manifeste et les crédits obligatoires. Demande les versions par plateforme si tu en as besoin (vertical, GIF, WebM pour le web).

## Où regarder

| Quoi | Où |
| --- | --- |
| Le brief et le storyboard | `BRIEF.md`, `.motion/storyboard.md` |
| Le dernier rendu et sa planche contact | `.motion/renders/<id>/video.mp4`, `sheet.jpg` |
| La note, les points bloquants, les correctifs | `.motion/AUDIT.md` |
| Les livrables | `deliverables/` |
| Les tokens consommés par étape | `/umd:tokens` |

## Reprendre plus tard

Ferme Claude Code quand tu veux. Au retour, `/umd:go` relit l'état du projet et reprend à la bonne étape. Pour une longue pause, `/umd:handoff` laisse une note que la session suivante lit en premier.
