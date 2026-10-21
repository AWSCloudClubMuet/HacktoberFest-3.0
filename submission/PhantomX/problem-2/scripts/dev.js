import { spawn } from 'node:child_process';

const children = [];
let stopping = false;

function start(args) {
  const child = spawn(process.execPath, args, { stdio: 'inherit' });
  children.push(child);
  child.on('exit', (code, signal) => {
    if (stopping || signal) return;
    if (code && code !== 0) shutdown(code);
  });
}

function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

start(['server/index.js']);
start(['node_modules/vite/bin/vite.js', '--config', 'client/vite.config.js']);
