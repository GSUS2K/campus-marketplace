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

import WebGLCanvas from './components/WebGLCanvas';

// ─── Theme Engine ────────────────────────────────────────────────────────────
// The theme is now driven by data-theme matching the Outfit dots (light, dark, red)
function useTheme() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('lpu_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lpu_theme', theme);
  }, [theme]);

  return [theme, setTheme];
}

// Custom Cursor removed as requested for a cleaner UI

const ChatLobby = () => {
  const params = new URLSearchParams(window.location.search);
  const sellerId = params.get('sellerId') || 'Unknown';
  const productName = params.get('product') || '';
  return (
  <div className="p-20 flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
    <div className="mb-8 flex items-center justify-center gap-3">
      <span className="w-2 h-2 rounded-full bg-[#8C7A6B] animate-pulse"></span>
      <p className="text-[10px] tracking-[0.5em] uppercase text-[#8C7A6B]">Encrypted Channel Active</p>
    </div>
    <h2 className="text-4xl md:text-5xl font-serif text-theme font-light">Archive Communications</h2>
    <p className="text-[10px] uppercase tracking-ultra-wide text-theme/50 mt-6 max-w-md text-center leading-loose border-b border-theme/20 pb-8">
      Establishing direct link to Curator Identity. All comms are end-to-End encrypted via the TRMS protocol.
    </p>
    <div className="mt-12 w-full max-w-lg border border-theme/20 p-6 bg-theme/5">
      <p className="text-[9px] tracking-[0.3em] uppercase text-theme/40 mb-4">Message Composer</p>
      <textarea 
        className="w-full bg-transparent border-b border-theme/20 text-sm font-sans resize-none outline-none py-2 text-theme placeholder:text-theme/20 mb-6" 
        rows="3" 
        placeholder="Draft your secure message..."
      />
      <div className="text-right">
        <button className="px-8 py-3 bg-theme text-bg text-[9px] tracking-[0.4em] uppercase hover:opacity-80 transition-opacity">
          Transmit
        </button>
      </div>
    </div>
  </div>
)};



const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('trms_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// ─── Navigation (Outfit Brutalist Style) ─────────────────────────────────────
const Navigation = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('trms_token');
  const user = JSON.parse(localStorage.getItem('trms_user') || 'null');
  
  // We'll use a simple localStorage array for cart items
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

  const removeFromCart = (index) => {
    const newCart = [...cartItems];
    newCart.splice(index, 1);
    localStorage.setItem('outfit_cart', JSON.stringify(newCart));
    setCartItems(newCart);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleLogout = () => {
    localStorage.removeItem('trms_token');
    localStorage.removeItem('trms_user');
    localStorage.removeItem('outfit_cart'); // Clear bag on logout
    window.dispatchEvent(new Event('cartUpdated'));
    navigate('/login');
  };

  // Close cart on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCartOpen) {
        setIsCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen]);

  return (
    <>
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl bg-bg/85 backdrop-blur-2xl shadow-2xl text-theme z-50 transition-all duration-500 py-4 px-8 flex items-center justify-between font-sans rounded-full border border-theme/10">
        {/* Left: Logo */}
        <Link to="/" className="text-2xl font-serif font-black tracking-tighter flex items-center gap-1 hover:scale-105 transition-transform">
          <span className="text-theme">LPU Archive.</span>
        </Link>

        {/* Right: Links & Theme Dots */}
        <div className="flex items-center gap-6 text-[15px] font-bold">
          <Link to="/" className="hover:text-theme/70 transition-colors">Shop</Link>
          
          {token ? (
            <>
              <button onClick={() => setIsCartOpen(true)} className="hover:text-theme/70 transition-colors">Bag ({cartItems.length})</button>
              {user?.role !== 'buyer' && (
                <Link to="/post" className="hover:text-theme/70 transition-colors">Add to Archive</Link>
              )}
              {user?.role !== 'buyer' && (
                <Link to="/analytics" className="hover:text-theme/70 transition-colors">Dashboard</Link>
              )}
              {user?.role === 'admin' && (
                <Link to="/admin" className="hover:text-theme/70 transition-colors">Admin</Link>
              )}
              <Link to="/profile" className="hover:text-theme/70 transition-colors">Profile</Link>
              <button onClick={handleLogout} className="hover:text-theme/70 transition-colors">Logout</button>
            </>
          ) : (
            <Link to="/login" className="hover:text-theme/70 transition-colors">Log In</Link>
          )}
          
          {/* Theme Switcher Dots */}
          <div className="flex items-center gap-2 ml-4">
            <button onClick={() => setTheme('dark')} className={`w-4 h-4 rounded-full bg-[#111] ${theme === 'dark' ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg' : ''}`} aria-label="Dark Theme" />
            <button onClick={() => setTheme('light')} className={`w-4 h-4 rounded-full bg-[#F8F6F0] ${theme === 'light' ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg' : ''}`} aria-label="Light Theme" />
            <button onClick={() => setTheme('matcha')} className={`w-4 h-4 rounded-full bg-[#C4D6B0] ${theme === 'matcha' ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg' : ''}`} aria-label="Matcha Theme" />
          </div>
        </div>
      </nav>

      {/* Cart Modal Overlay */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Strong backdrop to hide background */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsCartOpen(false)}></div>
          
          <div className="relative w-full max-w-2xl bg-bg shadow-2xl rounded-3xl flex flex-col max-h-[85vh] overflow-hidden animate-fade-in border-[2px] border-theme/20">
            <div className="p-8 border-b border-theme/20 flex justify-between items-center bg-transparent text-theme">
              <h2 className="text-2xl font-serif font-bold tracking-wide">Your Bag</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-[28px] font-light hover:scale-110 transition-transform opacity-70 hover:opacity-100">&times;</button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-8 space-y-6">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                  <p className="text-[16px] font-medium text-theme">Your bag is empty.</p>
                  <p className="text-[12px] mt-2 text-theme">Press Esc to close</p>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div key={idx} className="flex gap-6 items-center p-4 rounded-2xl border border-theme/20 bg-theme/5 hover:bg-theme/10 transition-colors">
                    <img 
                      src={item.images[0]} 
                      alt={item.title} 
                      className="w-24 h-28 object-cover rounded-xl shadow-sm bg-theme/10" 
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/300x400?text=No+Image' }}
                    />
                    <div className="flex-grow text-theme">
                      <h4 className="font-bold text-[16px] line-clamp-1">{item.title}</h4>
                      <p className="font-medium mt-1 opacity-80 text-[14px]">₹{item.price.toLocaleString()}</p>
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

            <div className="p-8 border-t border-theme/20 bg-theme/5 text-theme">
              <div className="flex justify-between items-end mb-6">
                <span className="font-medium opacity-80">Total</span>
                <span className="font-bold text-[24px]">₹{cartItems.reduce((acc, curr) => acc + curr.price, 0).toLocaleString()}</span>
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

// ─── Page Transitions ──────────────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.8
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={
          <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
            <Login />
          </motion.div>
        } />
        <Route path="/" element={
          <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
            <MarketFeed />
          </motion.div>
        } />
        <Route path="/product/:id" element={
          <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
            <ProductDetail />
          </motion.div>
        } />
        <Route path="/post" element={
          <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
            <ProtectedRoute><CreatePost /></ProtectedRoute>
          </motion.div>
        } />
        <Route path="/profile" element={
          <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
            <ProtectedRoute><Profile /></ProtectedRoute>
          </motion.div>
        } />
        <Route path="/analytics" element={
          <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
            <ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>
          </motion.div>
        } />
        <Route path="/admin" element={
          <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
            <ProtectedRoute><AdminDashboard /></ProtectedRoute>
          </motion.div>
        } />
        <Route path="/chat" element={
          <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
            <ProtectedRoute><ChatLobby /></ProtectedRoute>
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
};

// ─── App Root ─────────────────────────────────────────────────────────────────
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
              <span>THE LPU ARCHIVE</span>
              <span>© 2026</span>
            </footer>
          </div>
        </BrowserRouter>
      </div>
    </SocketProvider>
  );
}

export default App;
