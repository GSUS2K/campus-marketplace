import React, { useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, Menu, Plus, Search, ShieldCheck, ShoppingBag, UserCircle, X } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './context/SocketContext';
import { ProductImage } from './components/Ui';
import WebGLCanvas from './components/WebGLCanvas';

import Login from './pages/Login';
import MarketFeed from './pages/MarketFeed';
import CreatePost from './pages/CreatePost';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import ProductDetail from './pages/ProductDetail';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import ChatRoom from './pages/ChatRoom';

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('lpu_theme') || 'light');
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('lpu_theme', theme); }, [theme]);
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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const token = localStorage.getItem('trms_token');
  const user = JSON.parse(localStorage.getItem('trms_user') || 'null');
  const isDemoMode = new URLSearchParams(window.location.search).get('demo') === '1';
  const withDemo = (path) => isDemoMode ? `${path}?demo=1` : path;

  useEffect(() => {
    const updateCart = () => setCartItems(JSON.parse(localStorage.getItem('outfit_cart') || '[]'));
    updateCart();
    window.addEventListener('storage', updateCart);
    window.addEventListener('cartUpdated', updateCart);
    return () => { window.removeEventListener('storage', updateCart); window.removeEventListener('cartUpdated', updateCart); };
  }, []);

  const closeMenu = () => setIsMenuOpen(false);
  const removeFromCart = (index) => {
    const next = cartItems.filter((_, itemIndex) => itemIndex !== index);
    localStorage.setItem('outfit_cart', JSON.stringify(next));
    setCartItems(next);
    window.dispatchEvent(new Event('cartUpdated'));
  };
  const logout = () => { localStorage.removeItem('trms_token'); localStorage.removeItem('trms_user'); localStorage.removeItem('outfit_cart'); navigate('/login'); };

  const links = token || isDemoMode ? [
    { to: withDemo('/'), label: 'Browse', icon: <Search size={15} /> },
    { to: withDemo('/profile'), label: 'My space', icon: <UserCircle size={15} /> },
    ...(user?.role !== 'buyer' || isDemoMode ? [{ to: withDemo('/post'), label: 'Sell', icon: <Plus size={15} /> }] : []),
    ...(user?.role !== 'buyer' || isDemoMode ? [{ to: withDemo('/analytics'), label: 'Insights', icon: <LayoutDashboard size={15} /> }] : []),
    ...(isDemoMode ? [{ to: withDemo('/admin'), label: 'Moderate', icon: <ShieldCheck size={15} /> }] : [])
  ] : [{ to: '/', label: 'Browse', icon: <Search size={15} /> }];

  return (
    <>
      <nav className="glass-panel fixed left-1/2 top-4 z-50 flex w-[calc(100%-2rem)] max-w-7xl -translate-x-1/2 items-center justify-between rounded-2xl px-4 py-3 sm:px-5">
        <Link to={isDemoMode ? '/?demo=1' : '/'} onClick={closeMenu} className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-theme text-bg text-sm font-bold">L</span><span className="text-lg font-semibold tracking-[-0.05em] sm:text-xl">LPU Marketplace</span></Link>
        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => <Link key={link.to} to={link.to} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-theme/65 transition hover:bg-theme/8 hover:text-theme">{link.icon}{link.label}</Link>)}
          {(token || isDemoMode) && <button onClick={() => setIsCartOpen(true)} className="ml-2 flex items-center gap-2 rounded-xl border border-theme/15 px-3 py-2 text-sm font-medium text-theme/70 transition hover:bg-theme/8 hover:text-theme"><ShoppingBag size={15} />Bag <span className="text-xs text-theme/45">{cartItems.length}</span></button>}
          {!token && !isDemoMode && <Link to="/login" className="ml-2 rounded-xl bg-theme px-4 py-2 text-sm font-semibold text-bg">Sign in</Link>}
          {token && <button onClick={logout} className="ml-2 px-3 py-2 text-sm font-medium text-theme/45 hover:text-theme">Log out</button>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTheme('dark')} aria-label="Dark theme" className={`h-4 w-4 rounded-full bg-[#111] ${theme === 'dark' ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg' : ''}`} />
          <button onClick={() => setTheme('light')} aria-label="Light theme" className={`h-4 w-4 rounded-full bg-[#F8F6F0] ${theme === 'light' ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg' : ''}`} />
          <button onClick={() => setTheme('matcha')} aria-label="Matcha theme" className={`h-4 w-4 rounded-full bg-[#C4D6B0] ${theme === 'matcha' ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg' : ''}`} />
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Open menu" className="ml-2 rounded-xl p-2 text-theme lg:hidden">{isMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
        {isMenuOpen && <div className="glass-panel absolute left-0 right-0 top-[calc(100%+0.5rem)] rounded-2xl p-2 lg:hidden">{links.map((link) => <Link key={link.to} to={link.to} onClick={closeMenu} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium hover:bg-theme/8">{link.icon}{link.label}</Link>)}{(token || isDemoMode) && <button onClick={() => { setIsCartOpen(true); closeMenu(); }} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium hover:bg-theme/8"><ShoppingBag size={15} />Bag ({cartItems.length})</button>}{!token && !isDemoMode && <Link to="/login" onClick={closeMenu} className="mt-2 flex rounded-xl bg-theme px-4 py-3 text-sm font-semibold text-bg">Sign in</Link>}{token && <button onClick={logout} className="flex w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-theme/55">Log out</button>}</div>}
      </nav>
      {isCartOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><button aria-label="Close bag" className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsCartOpen(false)} /><div className="glass-panel relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl"><div className="flex items-center justify-between border-b border-theme/10 p-6"><div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-theme/45">Saved for checkout</p><h2 className="mt-1 text-2xl font-semibold">Your bag</h2></div><button onClick={() => setIsCartOpen(false)} aria-label="Close bag"><X /></button></div><div className="flex-1 space-y-3 overflow-y-auto p-6">{cartItems.length === 0 ? <div className="rounded-2xl border border-dashed border-theme/15 p-12 text-center"><ShoppingBag className="mx-auto mb-3 text-theme/35" /><p className="font-medium">Your bag is empty</p><p className="mt-1 text-sm text-theme/50">Save a few listings while you browse.</p></div> : cartItems.map((item, index) => <div key={`${item._id || item.title}-${index}`} className="flex items-center gap-4 rounded-2xl border border-theme/10 bg-theme/5 p-3"><ProductImage src={item.images?.[0]} title={item.title} alt={item.title} className="h-20 w-16 shrink-0 rounded-xl" /><div className="min-w-0 flex-1"><p className="truncate font-medium">{item.title}</p><p className="mt-1 text-sm text-theme/55">Rs. {Number(item.price || 0).toLocaleString()}</p></div><button onClick={() => removeFromCart(index)} className="rounded-lg px-3 py-2 text-xs text-theme/50 hover:bg-theme/8 hover:text-theme">Remove</button></div>)}</div>{cartItems.length > 0 && <div className="border-t border-theme/10 p-6"><div className="mb-4 flex justify-between"><span className="text-theme/55">Total</span><strong>Rs. {cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0).toLocaleString()}</strong></div><button className="w-full rounded-xl bg-theme py-3 text-sm font-semibold text-bg">Continue to checkout</button></div>}</div></div>}
    </>
  );
};

const pageVariants = { initial: { opacity: 0, y: 12 }, in: { opacity: 1, y: 0 }, out: { opacity: 0, y: -12 } };
const AnimatedRoutes = () => { const location = useLocation(); return <AnimatePresence mode="wait"><Routes location={location} key={location.pathname}><Route path="/login" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants}><Login /></motion.div>} /><Route path="/" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants}><MarketFeed /></motion.div>} /><Route path="/product/:id" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants}><ProductDetail /></motion.div>} /><Route path="/post" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants}><ProtectedRoute><CreatePost /></ProtectedRoute></motion.div>} /><Route path="/profile" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants}><ProtectedRoute><Profile /></ProtectedRoute></motion.div>} /><Route path="/analytics" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants}><ProtectedRoute><AnalyticsDashboard /></ProtectedRoute></motion.div>} /><Route path="/admin" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants}><ProtectedRoute><AdminDashboard /></ProtectedRoute></motion.div>} /><Route path="/chat" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants}><ProtectedRoute><ChatRoom /></ProtectedRoute></motion.div>} /></Routes></AnimatePresence>; };

function App() {
  const [theme, setTheme] = useTheme();
  return <SocketProvider><div className="min-h-screen text-theme"><Toaster position="bottom-center" toastOptions={{ className: 'bg-theme/90 backdrop-blur-md text-bg rounded-xl px-5 py-3 text-xs font-semibold shadow-2xl' }} /><WebGLCanvas /><BrowserRouter><div className="content-layer flex min-h-screen flex-col"><Navigation theme={theme} setTheme={setTheme} /><main className="w-full flex-1 pt-24"><AnimatedRoutes /></main><footer className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-8 text-xs text-theme/45 sm:px-8"><span className="font-semibold text-theme/70">LPU Marketplace</span><span>Made for campus life · 2026</span></footer></div></BrowserRouter></div></SocketProvider>;
}

export default App;
