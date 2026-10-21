// ============================================================
// saa-wak Backend — Entry Point
// ============================================================
import 'dotenv/config';
import http from 'http';
import app from './app';
import { initSocketIO } from './socket/socketServer';

const PORT = parseInt(process.env.PORT || '5000', 10);

const server = http.createServer(app);

// Attach Socket.IO
initSocketIO(server);

server.listen(PORT, () => {
  console.log(`\n🌱 saa-wak (ساوڪ) API server`);
  console.log(`   Listening on http://localhost:${PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health: http://localhost:${PORT}/api/v1/health\n`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

export default server;
