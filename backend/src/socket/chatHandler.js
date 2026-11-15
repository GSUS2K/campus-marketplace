import Chat from '../models/Chat.js';

export default function registerChatHandlers(io, socket) {
  // Join a specific chat room
  socket.on('join_chat', async ({ chatId }) => {
    const user = socket.data.user;
    if (!user) return socket.emit('error', { msg: 'Authentication required.' });
    const chat = await Chat.findById(chatId);
    const isParticipant = String(chat?.buyer) === user.id || String(chat?.seller) === user.id;
    const isAssignedIntermediary = user.role === 'intermediary' && String(chat?.adminIntermediary || '') === user.id;
    if (!chat || (!isParticipant && user.role !== 'admin' && !isAssignedIntermediary)) return socket.emit('error', { msg: 'You cannot join this channel.' });
    socket.join(chatId);
    console.log(`User ${user.id} joined chat ${chatId}`);
    
    // Optional: could emit previous messages or 'user_joined' status
  });

  // Typing indicators
  socket.on('typing', ({ chatId }) => {
    if (!socket.data.user || !socket.rooms.has(chatId)) return;
    socket.to(chatId).emit('user_typing', { userId: socket.data.user.id });
  });

  socket.on('stop_typing', ({ chatId }) => {
    if (!socket.data.user || !socket.rooms.has(chatId)) return;
    socket.to(chatId).emit('user_stop_typing', { userId: socket.data.user.id });
  });
}
