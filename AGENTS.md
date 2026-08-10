# AGENTS.md

## 1) Objectif du projet

Application web statique de creation de personnage pour Resilience.

- Version principale: interface desktop
- Version mobile: wizard pas-a-pas dans `m/`
- Donnees metier: fichiers JS dans `data/`
- Etat partageable: hash URL via `hashCodec.js`

## 2) Stack et execution

- JavaScript vanilla (modules ES)
- HTML/CSS/SCSS
- Sass CLI
- Tests unitaires Node (module `node:test`)

Commandes utiles:

- Installer: `npm install`
- Build SCSS: `npm run sass:build`
- Watch SCSS: `npm run sass:watch`
- Build SCSS prod: `npm run sass:build:prod`
- Tests: `npm test` (ou `node --test`)

## 3) Structure importante

- `index.html`: entree desktop
- `m/index.html`: entree mobile
- `partials/*.html`: fragments HTML partages (headers), charges via `lib/includeHtml.js`
- `lib/includeHtml.js`: mecanisme generique `data-include` (fetch + slots)
- `lib/headerMenu.js`: comportement partage du menu hamburger de header
- `script.js`: logique principale (selection, synchro fiche, hash, UI)
- `m/mobileWizard.js`: navigation et details des etapes mobile
- `viewMode.js`: bascule edition/vue via query param
- `personnage.js`: modele central de state
- `data/*.js`: referentiels (competences, dons, morphologies, etc.)

## 4) Conventions de modification

- Prioriser des changements minimaux et locaux.
- Preserver les ids HTML existants pour les inputs (on s'en sert pour calculer le hash).
- Eviter toute regression desktop quand une modif cible mobile, et inversement.
- Garder la logique de synchro centralisee dans `syncPersonnageFromDom`.
- Utiliser uniquement des modules ES (pas de conversion vers framework).

Pour le style:

- Modifier la source SCSS en priorite.
- Ne jamais modifier le CSS compilé.
- Ne jamais lancer de commande sass:build.
- Conserver les noms de classes deja utilises par le JS (`mobile-step-*`, `.option`, etc.).

## 5) Checklist avant de terminer une tache

1. Verifier que les fichiers modifies n'ont pas d'erreurs syntaxiques.
2. Lancer les tests hash si la logique d'etat/URL change.
3. Verifier rapidement les 2 modes:
	- desktop (`index.html`)
	- mobile (`m/index.html`)
4. Verifier le mode vue (`?view=1`) sur mobile et desktop.

## 6) Points d'attention connus

- La version mobile depend fortement de la structure DOM et des ids de groupes.
- Les etapes Morphologies sont segmentees par groupe (`armement`, `cuirasse`, `mains`, `peau`).
- La section Ameliorations peut etre masquee en mobile: eviter de l'inclure dans le wizard si elle est inactive.
- Les interactions checkbox/selection sont volontairement exclusives par groupe.

## 7) Style de code recommande

- Fonctions courtes, noms explicites.
- Garder les handlers d'evenements lisibles et defensifs.
- Ajouter un commentaire uniquement si la logique n'est pas evidente.
- Ne pas introduire de dependances externes sans besoin reel.

## 8) Quand demander confirmation

Demander validation utilisateur avant:

- changer les regles metier (scores, selections, contraintes)
- modifier des ids/attributs structurants du DOM
- retirer une fonctionnalite visible cote utilisateur
