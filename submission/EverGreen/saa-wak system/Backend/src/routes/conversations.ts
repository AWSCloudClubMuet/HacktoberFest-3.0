import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { CreateConversationSchema, SendMessageSchema } from '../lib/validation';
import { notFoundError, forbiddenError, validationError } from '../lib/errors';
import { getSocketIO } from '../socket/socketServer';

const router = Router();

// All conversation routes require authentication
router.use(authenticate);

function formatConversation(c: {
  id: string; user1Id: string; user2Id: string;
  listingId: string | null; createdAt: Date; updatedAt: Date;
  messages?: Array<{ id: string; text: string; senderId: string; createdAt: Date; readAt: Date | null }>;
  user1?: { id: string; displayName: string; role: string };
  user2?: { id: string; displayName: string; role: string };
}) {
  return {
    id: c.id,
    user1Id: c.user1Id,
    user2Id: c.user2Id,
    listingId: c.listingId,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    messages: c.messages?.map(formatMessage),
    user1: c.user1,
    user2: c.user2,
  };
}

function formatMessage(m: {
  id: string; senderId: string; text: string;
  createdAt: Date; readAt: Date | null;
}) {
  return {
    id: m.id,
    senderId: m.senderId,
    text: m.text,
    createdAt: m.createdAt.toISOString(),
    readAt: m.readAt?.toISOString() ?? null,
  };
}

// GET /conversations — user's conversations list
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const convos = await prisma.conversation.findMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      include: {
        user1: { select: { id: true, displayName: true, role: true } },
        user2: { select: { id: true, displayName: true, role: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // latest message preview
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Unread count per conversation
    const result = await Promise.all(
      convos.map(async (c) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: c.id,
            senderId: { not: userId },
            readAt: null,
          },
        });
        return { ...formatConversation(c), unreadCount };
      })
    );

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// POST /conversations — create or reuse a conversation
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = CreateConversationSchema.safeParse(req.body);
    if (!parsed.success) throw validationError('Validation failed', parsed.error.issues);

    const { recipientId, listingId, initialMessage } = parsed.data;
    const myId = req.user!.userId;

    if (recipientId === myId) throw validationError('Cannot start a conversation with yourself');

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
    if (!recipient) throw notFoundError('User', recipientId);

    // Ensure consistent user order (user1Id < user2Id lexicographically)
    const [user1Id, user2Id] = [myId, recipientId].sort();

    // Try to find existing conversation
    let convo = await prisma.conversation.findFirst({
      where: { user1Id, user2Id, listingId: listingId ?? null },
    });

    if (!convo) {
      convo = await prisma.conversation.create({
        data: { user1Id, user2Id, listingId: listingId ?? null },
      });
    }

    // Send initial message if provided
    if (initialMessage?.trim()) {
      const msg = await prisma.message.create({
        data: { conversationId: convo.id, senderId: myId, text: initialMessage.trim() },
      });
      // Broadcast via Socket.IO
      const io = getSocketIO();
      if (io) {
        io.to(`conversation:${convo.id}`).emit('new_message', {
          conversationId: convo.id,
          message: formatMessage(msg),
        });
      }
    }

    const full = await prisma.conversation.findUnique({
      where: { id: convo.id },
      include: {
        user1: { select: { id: true, displayName: true, role: true } },
        user2: { select: { id: true, displayName: true, role: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    res.status(201).json({ success: true, data: formatConversation(full!) });
  } catch (err) {
    next(err);
  }
});

// GET /conversations/:id — conversation with full message history
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const convo = await prisma.conversation.findUnique({
      where: { id },
      include: {
        user1: { select: { id: true, displayName: true, role: true } },
        user2: { select: { id: true, displayName: true, role: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!convo) throw notFoundError('Conversation', id);
    if (convo.user1Id !== userId && convo.user2Id !== userId) {
      throw forbiddenError('You are not a participant in this conversation');
    }

    // Mark messages from the other user as read
    await prisma.message.updateMany({
      where: {
        conversationId: convo.id,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    res.json({ success: true, data: formatConversation(convo) });
  } catch (err) {
    next(err);
  }
});

// POST /conversations/:id/messages — send a message
router.post('/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const convo = await prisma.conversation.findUnique({ where: { id } });

    if (!convo) throw notFoundError('Conversation', id);
    if (convo.user1Id !== userId && convo.user2Id !== userId) {
      throw forbiddenError('You are not a participant in this conversation');
    }

    const parsed = SendMessageSchema.safeParse(req.body);
    if (!parsed.success) throw validationError('Validation failed', parsed.error.issues);

    const msg = await prisma.message.create({
      data: { conversationId: convo.id, senderId: userId, text: parsed.data.text.trim() },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: convo.id },
      data: { updatedAt: new Date() },
    });

    const formatted = formatMessage(msg);

    // Broadcast to socket room
    const io = getSocketIO();
    if (io) {
      io.to(`conversation:${convo.id}`).emit('new_message', {
        conversationId: convo.id,
        message: formatted,
      });
    }

    res.status(201).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

// PATCH /conversations/:id/read — mark all messages read
router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const convo = await prisma.conversation.findUnique({ where: { id } });
    if (!convo) throw notFoundError('Conversation', id);
    if (convo.user1Id !== userId && convo.user2Id !== userId) {
      throw forbiddenError('Not a participant');
    }

    await prisma.message.updateMany({
      where: { conversationId: convo.id, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (err) {
    next(err);
  }
});

export default router;
