import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Porte } from './auth/Porte';
import { Invitation } from './auth/Invitation';
import { Coquille } from './Coquille';
import { Accueil } from './pages/Accueil';
import { Creations } from './pages/Creations';
import { Performance } from './pages/Performance';
import { Roadmap } from './pages/Roadmap';
import { Journal } from './pages/Journal';
import { Rapports } from './pages/Rapports';
import { Rapport } from './pages/Rapport';
import { Reglages } from './pages/Reglages';

/**
 * L'espace client.
 *
 * Tout passe par la porte, y compris le rapport imprimable : un
 * rapport mensuel se partage par lien, et un lien qui ouvrirait les
 * chiffres d'une marque sans connexion serait une fuite. Ce que la
 * marque voit ensuite est décidé par les politiques de la base, pas
 * par le routeur.
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* L'invitation vit hors de la porte : la personne n'a pas
            encore de compte, c'est ce lien qui vient le créer. */}
        <Route path="/invitation/:jeton" element={<Invitation onEntre={() => window.location.assign('/')} />} />
        <Route path="*" element={<Porte><Routes>
        {/* Le rapport imprimable sort de la coquille : une page seule,
            sans barre latérale, faite pour le PDF. */}
        <Route path="/rapports/:mois" element={<Rapport />} />
        <Route element={<Coquille />}>
          <Route index element={<Accueil />} />
          <Route path="creations" element={<Creations />} />
          <Route path="performance" element={<Performance />} />
          <Route path="journal" element={<Journal />} />
          <Route path="roadmap" element={<Roadmap />} />
          <Route path="rapports" element={<Rapports />} />
          <Route path="reglages" element={<Reglages />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes></Porte>} />
      </Routes>
    </BrowserRouter>
  );
}
