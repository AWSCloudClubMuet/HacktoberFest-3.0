// dev-runner.js
// Concurrently starts both Express backend (Port 5000) and Vite frontend (Port 3000)

const { spawn } = require('child_process');
const path = require('path');

console.log("=============================================================");
console.log("Team SheNova - Campus Gig & SkillSwap Portal");
console.log("Starting Full-Stack Application (Backend: 5000, Frontend: 3000)");
console.log("=============================================================\n");

const serverDir = path.join(__dirname, 'server');
const clientDir = path.join(__dirname, 'client');

const viteBin = path.join(clientDir, 'node_modules', 'vite', 'bin', 'vite.js');

// Launch Backend
const server = spawn(process.execPath, ['index.js'], {
  cwd: serverDir,
  stdio: 'inherit'
});

// Launch Frontend
const client = spawn(process.execPath, [viteBin, '--port', '3000', '--host'], {
  cwd: clientDir,
  stdio: 'inherit'
});

server.on('error', (err) => {
  console.error('[Server Error]:', err);
});

client.on('error', (err) => {
  console.error('[Client Error]:', err);
});

process.on('SIGINT', () => {
  console.log('\nShutting down Campus Gig Portal...');
  server.kill();
  client.kill();
  process.exit(0);
});
