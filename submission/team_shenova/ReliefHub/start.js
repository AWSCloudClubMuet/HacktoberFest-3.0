import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting ReliefHub Full-Stack Environment...');
console.log('   - Mock API Server on http://localhost:3001');
console.log('   - Vite React Frontend on http://localhost:5173\n');

// Start Mock API
const apiProcess = spawn(process.execPath, ['server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env, PORT: '3001' }
});

// Start Vite Dev Server
const viteBin = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');
const viteProcess = spawn(process.execPath, [viteBin, '--port', '5173'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: process.env
});

function cleanup() {
  console.log('\n🛑 Shutting down ReliefHub processes...');
  try { apiProcess.kill(); } catch (e) {}
  try { viteProcess.kill(); } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
