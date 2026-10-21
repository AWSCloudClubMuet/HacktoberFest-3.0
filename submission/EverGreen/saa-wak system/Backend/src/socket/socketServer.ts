// ============================================================
// Socket.IO server — real-time messaging
// ============================================================
import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verifyToken } from '../lib/jwt';
import prisma from '../lib/prisma';

let io: SocketServer | null = null;

export function initSocketIO(server: HttpServer): void {
  const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  io = new SocketServer(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // ── Authentication middleware ─────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = verifyToken(token as string);
      (socket as AuthenticatedSocket).userId = payload.userId;
      (socket as AuthenticatedSocket).userRole = payload.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ── Connection handler ────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const userId = authSocket.userId;

    console.log(`Socket connected: user=${userId}`);

    // Join personal room for targeted events
    socket.join(`user:${userId}`);

    // ── Join a conversation room ──────────────────────────
    socket.on('join_conversation', async (conversationId: string) => {
      try {
        // Verify membership before joining room
        const convo = await prisma.conversation.findUnique({
          where: { id: conversationId },
        });

        if (!convo || (convo.user1Id !== userId && convo.user2Id !== userId)) {
          socket.emit('error', { message: 'Not a participant in this conversation' });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        socket.emit('joined_conversation', { conversationId });
      } catch {
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // ── Leave conversation room ───────────────────────────
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // ── Typing indicator ──────────────────────────────────
    socket.on('typing_start', ({ conversationId }: { conversationId: string }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
      });
    });

    socket.on('typing_stop', ({ conversationId }: { conversationId: string }) => {
      socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
        conversationId,
        userId,
      });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: user=${userId}`);
    });
  });

  console.log('Socket.IO initialized');
}

export function getSocketIO(): SocketServer | null {
  return io;
}

interface AuthenticatedSocket extends Socket {
  userId: string;
  userRole: string;
}
