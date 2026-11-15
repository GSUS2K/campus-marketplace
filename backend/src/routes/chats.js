import express from 'express';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import TrustEngine from '../services/TrustEngine.js';

const router = express.Router();

const canAccessChat = (chat, userId) => {
  const buyerId = chat?.buyer?._id?.toString?.() || chat?.buyer?.toString?.();
  const sellerId = chat?.seller?._id?.toString?.() || chat?.seller?.toString?.();

  return chat && (
    buyerId === userId ||
    sellerId === userId
  );
};

const canModerateChat = (chat, user) => user?.role === 'admin' || (user?.role === 'intermediary' && String(chat.adminIntermediary || '') === String(user.id));

const loadChatPayload = async (chatId) => {
  const chat = await Chat.findById(chatId)
    .populate('product', ['title', 'price', 'category', 'images', 'campusLocation', 'status'])
    .populate('buyer', ['name', 'email', 'campusLocation', 'trustScore', 'isTrustedSeller'])
    .populate('seller', ['name', 'email', 'campusLocation', 'trustScore', 'isTrustedSeller'])
    .populate('adminIntermediary', ['name', 'email', 'trustScore', 'isTrustedSeller']);

  if (!chat) return null;

  const messages = await Message.find({ chatId })
    .populate('sender', ['name', 'role', 'isTrustedSeller'])
    .sort({ createdAt: 1 });

  return { chat, messages };
};

router.post('/for-product/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const currentUserId = req.user.id;

    const product = await Product.findById(productId).populate('seller', ['name', 'email', 'trustScore', 'isTrustedSeller']);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    const sellerId = product.seller?._id?.toString?.() || product.seller?.toString?.();
    if (!sellerId) {
      return res.status(400).json({ msg: 'Seller not available for this product' });
    }

    if (sellerId === currentUserId) {
      return res.status(400).json({ msg: 'You cannot open a chat with yourself' });
    }

    let chat = await Chat.findOne({
      product: productId,
      buyer: currentUserId,
      seller: sellerId
    });

    if (!chat) {
      const sellerRequiresIntermediary = await TrustEngine.requiresIntermediary(sellerId);
      const intermediary = sellerRequiresIntermediary ? await User.findOne({ role: 'intermediary', status: 'verified' }).select('_id') : null;
      const admin = !intermediary && sellerRequiresIntermediary ? await User.findOne({ role: 'admin' }).select('_id') : null;
      chat = await Chat.create({
        product: productId,
        buyer: currentUserId,
        seller: sellerId,
        isIntermediaryActive: sellerRequiresIntermediary,
        adminIntermediary: intermediary?._id || admin?._id || undefined
      });
    }

    const payload = await loadChatPayload(chat._id);
    return res.json(payload);
  } catch (err) {
    console.error('[Chats] create chat failed:', err.message);
    return res.status(500).send('Server Error');
  }
});

router.put('/:chatId/mediation', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ msg: 'Chat not found.' });
    if (!canAccessChat(chat, req.user.id)) return res.status(403).json({ msg: 'Only the buyer or seller can request mediation.' });
    if (chat.isIntermediaryActive) return res.status(409).json({ msg: 'A moderator is already assigned to this conversation.' });
    const intermediary = await User.findOne({ role: 'intermediary', status: 'verified' }).select('_id name');
    const admin = !intermediary ? await User.findOne({ role: 'admin' }).select('_id name') : null;
    chat.isIntermediaryActive = true;
    chat.adminIntermediary = intermediary?._id || admin?._id || null;
    await chat.save();
    const message = await Message.create({ chatId: chat._id, sender: req.user.id, content: 'Campus mediation has been requested for this conversation.', messageType: 'system_alert' });
    const io = req.app.get('io');
    if (io) io.to(chat._id.toString()).emit('receive_message', await Message.findById(message._id).populate('sender', ['name', 'role', 'isTrustedSeller']));
    return res.json(await loadChatPayload(chat._id));
  } catch (err) {
    console.error('[Chats] mediation request failed:', err.message);
    return res.status(500).json({ msg: 'Could not request campus mediation.' });
  }
});

router.get('/:chatId', auth, async (req, res) => {
  try {
    const payload = await loadChatPayload(req.params.chatId);
    if (!payload) {
      return res.status(404).json({ msg: 'Chat not found' });
    }

    if (!canAccessChat(payload.chat, req.user.id) && !canModerateChat(payload.chat, req.user)) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    return res.json(payload);
  } catch (err) {
    console.error('[Chats] load chat failed:', err.message);
    return res.status(500).send('Server Error');
  }
});

router.get('/:chatId/messages', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ msg: 'Chat not found' });
    }

    if (!canAccessChat(chat, req.user.id) && !canModerateChat(chat, req.user)) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const messages = await Message.find({ chatId: req.params.chatId })
      .populate('sender', ['name', 'role', 'isTrustedSeller'])
      .sort({ createdAt: 1 });

    return res.json(messages);
  } catch (err) {
    console.error('[Chats] load messages failed:', err.message);
    return res.status(500).send('Server Error');
  }
});

router.post('/:chatId/messages', auth, async (req, res) => {
  try {
    const { content, type = 'text' } = req.body;
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ msg: 'Chat not found' });
    }

    if (!canAccessChat(chat, req.user.id) && !canModerateChat(chat, req.user)) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ msg: 'Message cannot be empty' });
    }

    const message = await Message.create({
      chatId: req.params.chatId,
      sender: req.user.id,
      content: content.trim(),
      messageType: type
    });

    const populatedMessage = await Message.findById(message._id).populate('sender', ['name', 'role', 'isTrustedSeller']);
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.chatId).emit('receive_message', populatedMessage);
    }

    return res.status(201).json(populatedMessage);
  } catch (err) {
    console.error('[Chats] send message failed:', err.message);
    return res.status(500).send('Server Error');
  }
});

export default router;
