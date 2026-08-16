import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './context/SocketContext';

import Login from './pages/Login';
import MarketFeed from './pages/MarketFeed';
import CreatePost from './pages/CreatePost';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import ProductDetail from './pages/ProductDetail';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import ChatRoom from './pages/ChatRoom';

import WebGLCanvas from './components/WebGLCanvas';

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('lpu_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lpu_theme', theme);
  }, [theme]);

  return [theme, setTheme];
}

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('trms_token');
  const isDemoMode = new URLSearchParams(window.location.search).get('demo') === '1';
  if (!token && !isDemoMode) return <Navigate to="/login" replace />;
  return children;
};

const Navigation = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('trms_token');
  const user = JSON.parse(localStorage.getItem('trms_user') || 'null');
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const updateCart = () => {
      const cart = JSON.parse(localStorage.getItem('outfit_cart') || '[]');
      setCartItems(cart);
    };

    updateCart();
    window.addEventListener('storage', updateCart);
    window.addEventListener('cartUpdated', updateCart);

    return () => {
      window.removeEventListener('storage', updateCart);
      window.removeEventListener('cartUpdated', updateCart);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsCartOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const removeFromCart = (index) => {
    const nextCart = [...cartItems];
    nextCart.splice(index, 1);
    localStorage.setItem('outfit_cart', JSON.stringify(nextCart));
    setCartItems(nextCart);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleLogout = () => {
    localStorage.removeItem('trms_token');
    localStorage.removeItem('trms_user');
    localStorage.removeItem('outfit_cart');
    window.dispatchEvent(new Event('cartUpdated'));
    navigate('/login');
  };

  return (
    <>
      <nav className="glass-panel fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl text-theme z-50 transition-all duration-500 py-4 px-6 sm:px-8 flex items-center justify-between font-sans rounded-full gap-4">
        <Link to="/" className="text-xl sm:text-2xl font-serif font-black tracking-tighter flex items-center gap-1 hover:scale-105 transition-transform">
          <span className="text-theme">LPU Marketplace</span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-6 text-[13px] sm:text-[15px] font-bold overflow-x-auto">
          <Link to="/" className="hover:text-theme/70 transition-colors">Shop</Link>

          {token ? (
            <>
              <button onClick={() => setIsCartOpen(true)} className="hover:text-theme/70 transition-colors whitespace-nowrap">
                Bag ({cartItems.length})
              </button>
              {user?.role !== 'buyer' && (
                <Link to="/post" className="hover:text-theme/70 transition-colors whitespace-nowrap">Add Listing</Link>
              )}
              {user?.role !== 'buyer' && (
                <Link to="/analytics" className="hover:text-theme/70 transition-colors whitespace-nowrap">Dashboard</Link>
              )}
              {user?.role === 'admin' && (
                <Link to="/admin" className="hover:text-theme/70 transition-colors whitespace-nowrap">Admin</Link>
              )}
              <Link to="/profile" className="hover:text-theme/70 transition-colors whitespace-nowrap">Profile</Link>
              <button onClick={handleLogout} className="hover:text-theme/70 transition-colors whitespace-nowrap">Logout</button>
            </>
          ) : (
            <Link to="/login" className="hover:text-theme/70 transition-colors whitespace-nowrap">Log In</Link>
          )}

          <div className="flex items-center gap-2 ml-2">
            <button onClick={() => setTheme('dark')} className={`w-4 h-4 rounded-full bg-[#111] ${theme === 'dark' ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg' : ''}`} aria-label="Dark Theme" />
            <button onClick={() => setTheme('light')} className={`w-4 h-4 rounded-full bg-[#F8F6F0] ${theme === 'light' ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg' : ''}`} aria-label="Light Theme" />
            <button onClick={() => setTheme('matcha')} className={`w-4 h-4 rounded-full bg-[#C4D6B0] ${theme === 'matcha' ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg' : ''}`} aria-label="Matcha Theme" />
          </div>
        </div>
      </nav>

      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsCartOpen(false)} />

          <div className="glass-panel relative w-full max-w-2xl rounded-3xl flex flex-col max-h-[85vh] overflow-hidden animate-fade-in border-[2px] border-theme/20">
            <div className="p-6 sm:p-8 border-b border-theme/20 flex justify-between items-center bg-transparent text-theme">
              <h2 className="text-2xl font-serif font-bold tracking-wide">Your Bag</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-[28px] font-light hover:scale-110 transition-transform opacity-70 hover:opacity-100">&times;</button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 sm:p-8 space-y-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                  <p className="text-[16px] font-medium text-theme">Your bag is empty.</p>
                  <p className="text-[12px] mt-2 text-theme">Press Esc to close.</p>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div key={`${item._id || item.title}-${idx}`} className="flex gap-4 sm:gap-6 items-center p-4 rounded-2xl border border-theme/20 bg-theme/5 hover:bg-theme/10 transition-colors">
                    <img
                      src={item.images?.[0]}
                      alt={item.title}
                      className="w-20 h-24 sm:w-24 sm:h-28 object-cover rounded-xl shadow-sm bg-theme/10"
                      onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300x400?text=No+Image'; }}
                    />
                    <div className="flex-grow text-theme">
                      <h4 className="font-bold text-[16px] line-clamp-1">{item.title}</h4>
                      <p className="font-medium mt-1 opacity-80 text-[14px]">₹{Number(item.price || 0).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(idx)}
                      className="text-[12px] font-bold opacity-80 hover:opacity-100 uppercase text-theme px-4 py-2 border border-theme/40 rounded-full hover:bg-theme hover:text-bg transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 sm:p-8 border-t border-theme/20 bg-theme/5 text-theme">
              <div className="flex justify-between items-end mb-6">
                <span className="font-medium opacity-80">Total</span>
                <span className="font-bold text-[24px]">₹{cartItems.reduce((acc, curr) => acc + Number(curr.price || 0), 0).toLocaleString()}</span>
              </div>
              <button className="w-full py-5 bg-theme text-bg font-bold text-[15px] rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.8
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><Login /></motion.div>} />
        <Route path="/" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><MarketFeed /></motion.div>} />
        <Route path="/product/:id" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><ProductDetail /></motion.div>} />
        <Route path="/post" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><ProtectedRoute><CreatePost /></ProtectedRoute></motion.div>} />
        <Route path="/profile" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><ProtectedRoute><Profile /></ProtectedRoute></motion.div>} />
        <Route path="/analytics" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><ProtectedRoute><AnalyticsDashboard /></ProtectedRoute></motion.div>} />
        <Route path="/admin" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><ProtectedRoute><AdminDashboard /></ProtectedRoute></motion.div>} />
        <Route path="/chat" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><ProtectedRoute><ChatRoom /></ProtectedRoute></motion.div>} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const [theme, setTheme] = useTheme();

  return (
    <SocketProvider>
      <div className="min-h-screen text-theme transition-colors duration-500 flex flex-col relative bg-transparent">
        <Toaster
          position="bottom-center"
          toastOptions={{
            className: 'bg-theme/90 backdrop-blur-md text-bg border-[2px] border-bg/10 rounded-full px-8 py-4 font-bold text-xs tracking-widest uppercase shadow-2xl pointer-events-none'
          }}
        />
        <WebGLCanvas />
        <BrowserRouter>
          <div className="content-layer flex flex-col min-h-screen">
            <Navigation theme={theme} setTheme={setTheme} />

            <main className="w-full flex-grow pt-32">
              <AnimatedRoutes />
            </main>

            <footer className="py-8 border-t-[3px] border-theme mt-20 flex justify-between px-8 text-[12px] font-bold bg-bg/80 backdrop-blur-sm relative z-10">
              <span>LPU MARKET</span>
              <span>© 2026</span>
            </footer>
          </div>
        </BrowserRouter>
      </div>
    </SocketProvider>
  );
}

export default App;
