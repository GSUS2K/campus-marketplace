import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

export default function registerChatHandlers(io, socket) {
  // Join a specific chat room
  socket.on('join_chat', async ({ chatId, userId }) => {
    socket.join(chatId);
    console.log(`User ${userId} joined chat ${chatId}`);
    
    // Optional: could emit previous messages or 'user_joined' status
  });

  // Handle incoming messages
  socket.on('send_message', async ({ chatId, senderId, content, type }) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit('error', { msg: 'Chat not found' });
        return;
      }

      const message = new Message({
        chatId,
        sender: senderId,
        content,
        messageType: type || 'text'
      });
      await message.save();

      // Broadcast the saved message to everyone in the room, including sender to confirm
      io.to(chatId).emit('receive_message', message);
      
    } catch (err) {
      console.error('[ChatHandler] Error sending message:', err);
      socket.emit('error', { msg: 'Failed to send message' });
    }
  });

  // Typing indicators
  socket.on('typing', ({ chatId, userId }) => {
    socket.to(chatId).emit('user_typing', { userId });
  });

  socket.on('stop_typing', ({ chatId, userId }) => {
    socket.to(chatId).emit('user_stop_typing', { userId });
  });
}
