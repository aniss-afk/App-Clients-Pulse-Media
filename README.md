# App Clients — Pulse Media

L'espace que voit une marque accompagnée par l'agence : ses performances
tous canaux confondus, les créations produites pour elle, la feuille de
route et les rapports mensuels.

## Données et accès

Une session Supabase et un profil rattaché à la marque ouvrent le portail. Les écrans lisent les tables et fonctions de la base partagée avec l’agence. Une période sans import reste vide, une lecture en erreur peut être relancée. Les rapports utilisent ces mêmes données.

## Démarrer

```bash
npm install
npm run dev
```

## Démonstration avec données simulées

Lancer d’abord `npm run demo` dans `Admin-Pulse-Media`, puis dans ce dépôt :

```bash
npm run demo
```

Le portail s’ouvre sur http://127.0.0.1:5174, connecté à la marque fictive Maison Sève. Les ventes, charges et commissions sont celles de la base locale partagée avec l’agence. Modifier une charge dans l’agence puis recharger le portail met à jour le même bilan. Un badge identifie la simulation ; aucun compte externe n’est utilisé. Arrêter puis relancer le serveur agence remet les données à zéro.

Le dashboard affiche les ventes nettes HT, les charges, le bénéfice estimé et la marge, avec le détail des canaux au clic. Les revenus attribués Meta/Google/GA4/Klaviyo ne sont jamais additionnés au chiffre d’affaires de la boutique. Une couverture incomplète masque le résultat au lieu d’afficher un zéro trompeur. Le détail et les validations sont protégés par les fonctions et RLS du backend partagé.

Le mode connecté nécessite les deux migrations de pilotage financier et des sources du dépôt agence. Sans ces migrations, une erreur de lecture est affichée, sans repli automatique sur des chiffres fictifs.

## Charte

Identique à l'espace de gestion : crème `#F1EDE3`, encre `#12110F`,
rouge `#FF3B30`, Archivo. Le rouge est un aplat et une marque, jamais du
texte en petit corps — c'est `red-ink` qui porte les mots.
