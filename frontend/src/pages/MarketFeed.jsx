import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Marquee from '../components/Marquee';

import { CONDITION_LABELS, CATEGORIES, HOSTEL_GROUPS } from '../constants';

const ALL_HOSTELS = ['All Origins', ...Object.values(HOSTEL_GROUPS).flat()];

const TourOverlay = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const steps = [
    { title: "Welcome to The Archive.", text: "A high-fidelity, curated marketplace exclusive to verified campus academics. No outsiders. No noise." },
    { title: "The TRMS Protocol.", text: "Every artifact and curator is governed by the Trust & Reputation Management System. Authenticity is mathematically enforced." },
    { title: "Secure Channels.", text: "Engage in end-to-end encrypted dialogue with curators. Your data remains on campus." }
  ];

  useEffect(() => {
    if (step < 3) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [step]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}
      className="fixed top-0 left-0 w-screen h-screen z-[9999] flex items-center justify-center bg-bg/95 backdrop-blur-xl text-theme">
      <div className="max-w-md text-center px-8">
        <motion.p key={`phase-${step}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-[9px] tracking-[0.5em] uppercase opacity-40 mb-8">Phase {step + 1} of 3</motion.p>
        <motion.h2 key={`title-${step}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-serif font-light mb-6">{steps[step].title}</motion.h2>
        <motion.p key={`text-${step}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xs uppercase tracking-widest leading-loose opacity-60 mb-12">{steps[step].text}</motion.p>
        
        <motion.button 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          onClick={() => {
            if (step < 2) setStep(step + 1);
            else onComplete();
          }}
          className="px-12 py-4 border border-theme text-[9px] tracking-[0.4em] uppercase hover:bg-theme hover:text-bg transition-colors"
        >
          {step < 2 ? 'Acknowledge' : 'Enter The Archive'}
        </motion.button>
      </div>
    </motion.div>
  );
};

const MarketFeed = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLocation, setActiveLocation] = useState('All Origins');
  const [activeCategory, setActiveCategory] = useState('All Archives');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const dropdownRef = useRef(null);
  const { alerts } = useSocket();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('trms_token');
        
        // Check Tour
        if (!localStorage.getItem('archive_tour_seen') && token) {
          setShowTour(true);
        }

        const params = new URLSearchParams();
        if (activeCategory !== 'All Archives') params.append('category', activeCategory);
        if (activeLocation !== 'All Origins') params.append('location', activeLocation);
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setProducts(data);
      } catch (err) {
        console.error('Failed to fetch feed:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [activeLocation, activeCategory]);

  const completeTour = () => {
    localStorage.setItem('archive_tour_seen', 'true');
    setShowTour(false);
  };

  return (
    <div className="w-full min-h-screen pb-32 transition-colors duration-500 font-sans bg-transparent">
      
      {/* ── Marquee ───────────────────────────────────────────────────────────── */}
      <div className="w-full border-b-[3px] border-theme bg-bg/90 backdrop-blur-sm pt-28 pb-2">
        <Marquee text="THE LPU ARCHIVE — HIGH FIDELITY COMMERCE — VERIFIED CURATORS ONLY — NO OUTSIDERS — " />
      </div>

      {/* ── Hero (Outfit Style) ─────────────────────────────────────────────── */}
      <header className="pt-2 border-b-[3px] border-theme bg-bg/80 backdrop-blur-sm overflow-hidden flex justify-center w-full relative">
        <h1 className="text-[23vw] leading-[0.75] font-black tracking-tight text-theme select-none whitespace-nowrap">
          ARCHIVE.
        </h1>
      </header>

      {/* ── Filter Bar ───────────────────────────────────────── */}
      <div className="sticky top-[88px] z-40 bg-bg/90 backdrop-blur-md border-b-[3px] border-theme px-8 py-6 flex justify-between items-center transition-colors duration-500">
        <div className="flex gap-8 overflow-x-auto scrollbar-hide font-bold text-[14px]">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`uppercase whitespace-nowrap transition-colors ${
                activeCategory === cat ? 'text-theme' : 'text-theme/40 hover:text-theme/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Custom Location Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 text-[14px] font-bold text-theme uppercase hover:opacity-70 transition-opacity"
          >
            <span className="text-theme/40 text-xs">Origin:</span> 
            {activeLocation}
            <span className={`text-[10px] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>
          
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 top-full mt-4 w-56 max-h-96 overflow-y-auto bg-bg border-[2px] border-theme/20 shadow-2xl z-50 flex flex-col"
              >
                {ALL_HOSTELS.map(loc => (
                  <button
                    key={loc}
                    onClick={() => { setActiveLocation(loc); setIsDropdownOpen(false); }}
                    className={`px-6 py-4 text-left text-xs tracking-widest uppercase transition-colors ${activeLocation === loc ? 'bg-theme text-bg' : 'text-theme hover:bg-theme/5'}`}
                  >
                    {loc}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Product Grid ─────────────────────────────────────── */}
      <div className="w-full">
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-theme border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-theme">
             <div className="w-16 h-16 border-2 border-theme rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl">!</span>
             </div>
             <h3 className="text-xl font-bold uppercase mb-2">No Artifacts Found</h3>
             <p className="text-sm">We couldn't locate any items matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 p-8 bg-transparent backdrop-blur-sm">
            {products.map((product, idx) => (
              <motion.div 
                key={product._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="group relative flex flex-col hover:bg-theme/5 rounded-2xl p-2 transition-colors"
              >
                {/* Massive Image Container */}
                <div className="aspect-[3/4] w-full overflow-hidden bg-[#e5e5e5] relative border-[3px] border-theme hover:border-accent transition-colors duration-300">
                  <Link to={`/product/${product._id}`}>
                    <img 
                      src={product.images[0] || 'https://via.placeholder.com/600'} 
                      alt={product.title}
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0 mix-blend-multiply"
                      loading="lazy"
                    />
                    <img 
                      src={product.images[1] || product.images[0] || 'https://via.placeholder.com/600'} 
                      alt={`${product.title} Alternate`}
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-0 group-hover:opacity-100 group-hover:scale-105 transform mix-blend-multiply"
                      loading="lazy"
                    />
                  </Link>
                  {/* Verified Badge */}
                  {product.isVerifiedProduct && (
                    <div className="absolute top-4 left-4">
                      <span className="text-[10px] font-bold px-2 py-1 bg-theme text-bg uppercase">Verified</span>
                    </div>
                  )}
                </div>

                {/* Brutalist Info Bar */}
                <div className="py-4 flex flex-col justify-start">
                  <div>
                    <h3 className="font-bold text-[16px] leading-tight mb-1 uppercase line-clamp-2">{product.title}</h3>
                    <p className="text-[12px] opacity-60 uppercase">{product.category}</p>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="font-bold text-[18px]">₹{product.price.toLocaleString()}</span>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        const token = localStorage.getItem('trms_token');
                        if (!token) {
                          toast.error('Authentication required to use the Bag');
                          return;
                        }
                        const cart = JSON.parse(localStorage.getItem('outfit_cart') || '[]');
                        cart.push(product);
                        localStorage.setItem('outfit_cart', JSON.stringify(cart));
                        window.dispatchEvent(new Event('cartUpdated'));
                        toast.success(`${product.title} added to Bag`);
                      }}
                      className="w-10 h-10 rounded-full border-[2px] border-theme flex items-center justify-center hover:bg-theme hover:text-bg transition-colors"
                    >
                      <span className="font-bold">+</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketFeed;
