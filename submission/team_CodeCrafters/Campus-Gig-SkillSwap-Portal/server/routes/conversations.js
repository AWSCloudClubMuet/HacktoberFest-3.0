import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// GET /api/conversations - List conversations for authenticated user
router.get('/', (req, res) => {
  try {
    const authUserId = req.headers['x-user-id'] || 'usr_1';

    // Find all conversations where user is user1 or user2
    const convRows = db.prepare(`
      SELECT * FROM conversations
      WHERE user1_id = ? OR user2_id = ?
      ORDER BY updated_at DESC
    `).all(authUserId, authUserId);

    const formatted = convRows.map(conv => {
      const counterpartId = conv.user1_id === authUserId ? conv.user2_id : conv.user1_id;
      const counterpart = db.prepare('SELECT id, name, avatar, major FROM users WHERE id = ?').get(counterpartId);

      const msgs = db.prepare(`
        SELECT id, sender_id, text, created_at FROM messages
        WHERE conversation_id = ?
        ORDER BY id ASC
      `).all(conv.id);

      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;

      const participant = counterpart || { id: counterpartId, name: 'Student', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', major: 'Campus Peer' };

      return {
        id: conv.id,
        user: participant,
        participant_id: participant.id,
        participant_name: participant.name,
        participant_avatar: participant.avatar,
        participant_major: participant.major,
        online: true,
        last_message: lastMsg ? lastMsg.text : 'Start a conversation...',
        last_message_time: lastMsg ? lastMsg.created_at : '',
        messages: msgs.map(m => ({
          id: m.id,
          sender_id: m.sender_id,
          text: m.text,
          timestamp: m.created_at
        }))
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations', details: error.message });
  }
});

// POST /api/conversations/:id/messages - Send a message in conversation
router.post('/:id/messages', (req, res) => {
  try {
    const authUserId = req.headers['x-user-id'] || req.body.sender_id;
    if (!authUserId) {
      return res.status(401).json({ error: 'Authentication required: Missing x-user-id header' });
    }

    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conv.user1_id !== authUserId && conv.user2_id !== authUserId) {
      return res.status(403).json({ error: 'Unauthorized: You are not a participant in this conversation' });
    }

    const newMsgId = `m_${Date.now()}`;
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    db.prepare(`
      INSERT INTO messages (id, conversation_id, sender_id, text, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(newMsgId, conv.id, authUserId, text.trim(), timeString);

    db.prepare(`
      UPDATE conversations
      SET updated_at = ?
      WHERE id = ?
    `).run(new Date().toISOString(), conv.id);

    res.status(201).json({
      id: newMsgId,
      conversation_id: conv.id,
      sender_id: authUserId,
      text: text.trim(),
      timestamp: timeString
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
});

export default router;
