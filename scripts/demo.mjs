import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const status = await fetch('http://127.0.0.1:54329/demo/status').then(r => r.json()).catch(() => null);
if (status?.simulation !== true) throw new Error('Lancez d’abord npm run demo dans Admin-Pulse-Media.');
console.log('Espace client · données simulées partagées avec la démo agence.');
const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5174', '--strictPort'], {
  cwd: fileURLToPath(new URL('..', import.meta.url)), stdio: 'inherit',
  env: { ...process.env, VITE_PULSE_DEMO: 'true', VITE_SUPABASE_URL: 'http://127.0.0.1:54329', VITE_SUPABASE_ANON_KEY: 'pulse-local-demo-only' },
});
process.on('SIGINT', () => child.kill('SIGTERM'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
