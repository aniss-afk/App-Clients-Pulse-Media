import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Coquille } from './Coquille';
import { Accueil } from './pages/Accueil';
import { Creations } from './pages/Creations';
import { Performance } from './pages/Performance';
import { Roadmap } from './pages/Roadmap';
import { Journal } from './pages/Journal';
import { Rapports } from './pages/Rapports';
import { Rapport } from './pages/Rapport';

/**
 * L'espace client.
 *
 * Pas d'authentification pour l'instant : les données sont simulées et
 * ne concernent qu'une marque. Le jour où plusieurs marques se
 * connectent, c'est le service qui décidera ce qu'elles voient, et les
 * politiques de sécurité de la base derrière lui — pas le routeur.
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
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
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
