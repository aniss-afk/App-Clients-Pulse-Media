# App Clients — Pulse Media

L'espace que voit une marque accompagnée par l'agence : ses performances
tous canaux confondus, les créations produites pour elle, la feuille de
route et les rapports mensuels.

## Ce que la marque ne voit pas

Aucun objet servi par `src/services/espaceClient.ts` ne porte l'identité
d'un créateur — ni son nom, ni son compte, ni son audience, ni ce qu'il
touche. La frontière est tenue par le service, pas par l'interface : une
colonne ajoutée par erreur dans un écran ne peut pas révéler ce qui n'est
pas dans les données.

## Démarrer

```bash
npm install
npm run dev
```

## État

Données entièrement simulées, une seule marque, pas d'authentification.
Les fonctions du service sont asynchrones exprès : le jour où la base
répond à leur place, aucun écran ne change.

## Charte

Identique à l'espace de gestion : crème `#F1EDE3`, encre `#12110F`,
rouge `#FF3B30`, Archivo. Le rouge est un aplat et une marque, jamais du
texte en petit corps — c'est `red-ink` qui porte les mots.
