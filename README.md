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
npm test
npm run typecheck
npm run build
```

Le dépôt Admin contient `tests/pont-espaces.test.mjs` : fonctions SQL avec RLS,
isolation de deux boutiques, services réels compilés, erreurs et absence de repli sur des données fictives.

## Périodes et données manquantes

Les sélecteurs 7/30/90 jours couvrent des jours civils UTC terminés, jusqu’à hier.
Les comparaisons demandent une couverture complète des deux périodes et le même
périmètre publicitaire. Les totaux partiels sont accompagnés du nombre de jours
reçus ; les ratios et variations indisponibles restent masqués. Une source
absente dans le graphique est un trou, pas un zéro.

Le mois courant est arrêté à hier et comparé aux mêmes numéros de jours du mois
précédent. Si celui-ci est trop court, aucune variation n’est affichée. Les
historiques CA et publicité sont lus par pages, avec vérification du total annoncé.
Une interruption de lecture ne publie pas une somme incomplète.

`npm test` vérifie les périodes, la couverture, la pagination et le rendu du
graphique ; les mêmes cas sont rejoués sous UTC, Europe/Paris et Los Angeles.
Les données de ces tests restent confinées au processus de test.
