# Espace marque — Pulse Media

## Démarrer

```bash
npm install
npm run dev
```

Le mode réel est activé par défaut. Configurer `VITE_SUPABASE_URL` et
`VITE_SUPABASE_ANON_KEY`, puis se connecter avec un compte rattaché à la marque
ou au créateur. Les autorisations viennent de la base, jamais d’un filtre navigateur.
Une lecture vide reste vide et une erreur reste visible ; aucun remplacement par
les données de démonstration n’est effectué en mode réel.

Les fonctions du pont entre espaces nécessitent la migration Admin
`20261110193154_pont_espaces_workflows.sql` et ses migrations historiques.
Les rapports et demandes internes de l’agence restent privés tant qu’ils ne sont
pas publiés explicitement. Les décisions sur une création portent sur la même ligne
pour la marque, le créateur et l’agence.

## Simulation locale indépendante

```bash
npm run demo
```

Cette commande définit explicitement `VITE_DONNEES_REELLES=false` : ni connexion
Supabase ni identifiants réels ne sont utilisés. Un bandeau identifie la simulation.
Les décisions sont conservées dans le localStorage du navigateur. Effacer la clé
`pulse-marque-simulation-v1` pour repartir du jeu initial.
Cette simulation indépendante ne synchronise pas deux origines de navigateur ;
la démonstration intégrée de l’Admin utilise les vraies fonctions SQL sur PGlite local.

## Vérification

```bash
npm run typecheck
npm run build
```

Le dépôt Admin contient `tests/pont-espaces.test.mjs` : fonctions SQL avec RLS,
isolation de deux boutiques, services réels compilés, erreurs et persistance locale.
