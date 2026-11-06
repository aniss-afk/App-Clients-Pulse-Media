import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { configurationDemoLocale } from './demoLocal';
import './index.css';

const root = createRoot(document.getElementById('root')!);
async function demarrer() {
  try {
    const demo = configurationDemoLocale(import.meta.env);
    if (demo) {
      root.render(<p role="status" style={{ padding: 24 }}>Démarrage de la démonstration locale…</p>);
      const { supabase } = await import('./auth/supabase');
      const { error } = await supabase.auth.signInWithPassword({ email: 'client@demo.pulse.local', password: 'demo' });
      if (error) throw new Error('Le serveur de démonstration local est indisponible. Lancez npm run demo puis rechargez cette page.');
    }
    const { App } = await import('./App.tsx');
    root.render(<StrictMode>{demo && <div role="status" style={{ position: 'fixed', zIndex: 100, bottom: 8, right: 8, padding: '5px 10px', border: '1px solid #ddd', borderRadius: 5, background: '#fff', color: '#686868', font: '11px/1.4 sans-serif', pointerEvents: 'none' }}>Démonstration · données simulées</div>}<App /></StrictMode>);
  } catch (e) {
    root.render(<div role="alert" style={{ padding: 24 }}><h1>Démarrage impossible</h1><p>{e instanceof Error ? e.message : 'Vérifiez la configuration.'}</p><button type="button" onClick={() => window.location.reload()}>Réessayer</button></div>);
  }
}
void demarrer();
