# Espace marque — Pulse Media

## Démarrer

```bash
npm install
npm run dev
```

Configurer `VITE_SUPABASE_URL` et
`VITE_SUPABASE_ANON_KEY`, puis se connecter avec un compte rattaché à la marque. Les autorisations viennent de la base, jamais d’un filtre navigateur.
Une lecture vide reste vide et une erreur reste visible.

Les fonctions du pont entre espaces nécessitent la migration Admin
`20261110193154_pont_espaces_workflows.sql` et ses migrations historiques.
Les rapports et demandes internes de l’agence restent privés tant qu’ils ne sont
pas publiés explicitement. Les décisions sur une création portent sur la même ligne
pour la marque, le créateur et l’agence.

## Données

L’application ne contient aucun jeu de données de démonstration ni accès fictif.
Les anciennes clés de stockage de démonstration sont effacées au démarrage.
Une absence de données produit un état vide ; une erreur de lecture reste visible.

## Vérification

```bash
npm run typecheck
npm run build
```

Le dépôt Admin contient `tests/pont-espaces.test.mjs` : fonctions SQL avec RLS,
isolation de deux boutiques, services réels compilés, erreurs et absence de repli sur des données fictives.
