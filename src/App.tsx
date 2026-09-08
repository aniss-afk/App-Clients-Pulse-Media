import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Porte } from './auth/Porte';
import { Invitation } from './auth/Invitation';
import { Coquille } from './Coquille';
import { Resultats } from './pages/Resultats';
import { Creations } from './pages/Creations';
import { Suivi } from './pages/Suivi';
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
          <Route index element={<Resultats />} />
          <Route path="creations" element={<Creations />} />
          <Route path="suivi" element={<Suivi />} />
          <Route path="reglages" element={<Reglages />} />
          {/* Les anciennes adresses mènent là où leur contenu a été
              repris : un lien envoyé par email ne doit pas tomber sur
              une page morte. */}
          <Route path="performance" element={<Navigate to="/" replace />} />
          <Route path="rapports" element={<Navigate to="/" replace />} />
          <Route path="journal" element={<Navigate to="/suivi" replace />} />
          <Route path="roadmap" element={<Navigate to="/suivi" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes></Porte>} />
      </Routes>
    </BrowserRouter>
  );
}
