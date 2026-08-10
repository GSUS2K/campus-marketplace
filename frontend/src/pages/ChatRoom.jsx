import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import { DEMO_CHAT } from '../data/demoContent';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ChatRoom = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const chatEndRef = useRef(null);
  const [chatData, setChatData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const user = JSON.parse(localStorage.getItem('trms_user') || '{}');
  const productId = searchParams.get('productId');

  const productTitle = useMemo(
    () => searchParams.get('product') || chatData?.product?.title || 'Secure Channel',
    [searchParams, chatData]
  );

  useEffect(() => {
    const loadChat = async () => {
      if (!productId) {
        setErrorMsg('Open a listing first to start a secure channel.');
        setIsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('trms_token');
        const res = await fetch(`${API_BASE}/api/chats/for-product/${productId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || 'Unable to open chat');

        setChatData(data.chat);
        setMessages(data.messages || []);
      } catch (err) {
        setChatData(DEMO_CHAT.chat);
        setMessages(DEMO_CHAT.messages);
      } finally {
        setIsLoading(false);
      }
    };

    loadChat();
  }, [productId]);

  useEffect(() => {
    if (!socket || !chatData?._id || !user?.id) return;

    socket.emit('join_chat', { chatId: chatData._id, userId: user.id });

    const handleIncoming = (message) => {
      setMessages((prev) => {
        if (prev.some((existing) => existing._id === message._id)) return prev;
        return [...prev, message];
      });
    };

    socket.on('receive_message', handleIncoming);
    return () => socket.off('receive_message', handleIncoming);
  }, [socket, chatData?._id, user?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!draft.trim() || !chatData?._id) return;

    setIsSending(true);
    try {
      const token = localStorage.getItem('trms_token');
      const res = await fetch(`${API_BASE}/api/chats/${chatData._id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: draft.trim() })
      });

      const message = await res.json();
      if (!res.ok) throw new Error(message.msg || 'Message delivery failed');

      setMessages((prev) => [...prev, message]);
      setDraft('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen pt-32 flex items-center justify-center text-theme">
        <p className="text-[10px] tracking-[0.4em] uppercase animate-pulse">Opening Secure Channel...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="w-full min-h-screen pt-32 flex flex-col items-center justify-center gap-6 text-theme px-8">
        <p className="text-[10px] tracking-[0.4em] uppercase text-center max-w-md">{errorMsg}</p>
        <Link to="/" className="text-xs uppercase tracking-widest text-theme/60 hover:text-theme border-b border-theme/20 pb-1 transition-colors">
          Return to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen px-4 sm:px-8 pt-28 pb-16 text-theme">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg/90 backdrop-blur-xl border border-theme/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col min-h-[72vh]"
        >
          <div className="px-8 py-6 border-b border-theme/10 flex items-center justify-between gap-4">
            <div>
              <p className="text-[9px] tracking-[0.5em] uppercase text-theme/40 mb-2">Encrypted Channel</p>
              <h1 className="text-3xl md:text-4xl font-serif font-light">{productTitle}</h1>
            </div>
            <div className="text-right">
              <p className="text-[9px] tracking-[0.4em] uppercase text-theme/40">Room ID</p>
              <p className="text-xs font-mono break-all">{chatData?._id}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-8 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full min-h-[35vh] flex flex-col items-center justify-center text-center border border-dashed border-theme/15 rounded-[2rem] bg-theme/5">
                <p className="text-[10px] tracking-[0.4em] uppercase text-theme/40 mb-3">No messages yet</p>
                <p className="max-w-sm text-sm text-theme/70">
                  Start the conversation with a question about condition, pickup timing, or price.
                </p>
              </div>
            ) : (
              messages.map((message) => {
                const isMine = message.sender?._id === user.id;
                return (
                  <div key={message._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-[1.5rem] px-5 py-4 border ${isMine ? 'bg-theme text-bg border-theme' : 'bg-theme/5 border-theme/10'}`}>
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <p className="text-[9px] tracking-[0.35em] uppercase opacity-60">{message.sender?.name || 'Unknown'}</p>
                        <p className="text-[9px] tracking-[0.2em] uppercase opacity-50">
                          {new Date(message.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-theme/10 p-4 sm:p-6 bg-bg/95">
            <div className="flex flex-col sm:flex-row gap-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows="3"
                placeholder="Type a message..."
                className="flex-1 resize-none bg-transparent border border-theme/15 rounded-[1.5rem] px-5 py-4 text-sm outline-none focus:border-theme/40 transition-colors"
              />
              <button
                type="submit"
                disabled={isSending || !draft.trim()}
                className="px-8 py-4 rounded-full bg-theme text-bg font-bold text-[11px] tracking-[0.35em] uppercase disabled:opacity-40"
              >
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </motion.section>

        <aside className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg/90 backdrop-blur-xl border border-theme/10 rounded-[2.5rem] shadow-2xl p-8"
          >
            <p className="text-[9px] tracking-[0.5em] uppercase text-theme/40 mb-5">Conversation Details</p>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-[9px] tracking-[0.35em] uppercase text-theme/30 mb-1">Seller</p>
                <p className="font-medium">{chatData?.seller?.name || 'Seller'}</p>
              </div>
              <div>
                <p className="text-[9px] tracking-[0.35em] uppercase text-theme/30 mb-1">Your Role</p>
                <p className="font-medium">{user.role || 'member'}</p>
              </div>
              <div>
                <p className="text-[9px] tracking-[0.35em] uppercase text-theme/30 mb-1">Trust Mode</p>
                <p className="font-medium">{chatData?.isIntermediaryActive ? 'Admin mediated' : 'Direct'}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-theme text-bg rounded-[2.5rem] shadow-2xl p-8"
          >
            <p className="text-[9px] tracking-[0.5em] uppercase opacity-70 mb-4">Quick Actions</p>
            <div className="space-y-3">
              <Link to="/" className="block w-full text-center px-5 py-4 rounded-full border border-bg/20 text-[11px] tracking-[0.35em] uppercase hover:bg-bg hover:text-theme transition-colors">
                Back to feed
              </Link>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full px-5 py-4 rounded-full border border-bg/20 text-[11px] tracking-[0.35em] uppercase hover:bg-bg hover:text-theme transition-colors"
              >
                Return
              </button>
            </div>
          </motion.div>
        </aside>
      </div>
    </div>
  );
};

export default ChatRoom;
