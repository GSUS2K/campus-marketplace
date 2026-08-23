import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Marquee from '../components/Marquee';
import { CATEGORIES, HOSTEL_GROUPS } from '../constants';
import { DEMO_PRODUCTS } from '../data/demoContent';
import { requestJson } from '../lib/api';
import { ProductImage, StatusPill } from '../components/Ui';

const ALL_HOSTELS = ['All Origins', ...Object.values(HOSTEL_GROUPS).flat()];

const TourOverlay = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const steps = [
    { title: 'Welcome to the marketplace.', text: 'A curated marketplace for verified campus trading. Fast, direct, and intentional.' },
    { title: 'The Trust Layer.', text: 'Every listing carries trust signals so buyers can move with more confidence.' },
    { title: 'Secure Channels.', text: 'Start a private chat with the seller directly from the product page.' }
  ];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-bg/95 backdrop-blur-xl text-theme px-6"
    >
      <div className="max-w-lg text-center">
        <p className="text-[9px] tracking-[0.5em] uppercase opacity-40 mb-8">Phase {step + 1} of 3</p>
        <h2 className="text-4xl md:text-5xl font-serif font-light mb-5">{steps[step].title}</h2>
        <p className="text-xs uppercase tracking-widest leading-loose opacity-60 mb-12">{steps[step].text}</p>

        <button
          onClick={() => {
            if (step < steps.length - 1) {
              setStep(step + 1);
            } else {
              onComplete();
            }
          }}
          className="px-12 py-4 border border-theme text-[9px] tracking-[0.4em] uppercase hover:bg-theme hover:text-bg transition-colors"
        >
          {step < steps.length - 1 ? 'Acknowledge' : 'Start Browsing'}
        </button>
      </div>
    </motion.div>
  );
};

const MarketFeed = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLocation, setActiveLocation] = useState('All Origins');
  const [activeCategory, setActiveCategory] = useState('All Listings');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const dropdownRef = useRef(null);
  const { alerts } = useSocket();
  const demoSuffix = new URLSearchParams(window.location.search).get('demo') === '1' ? '?demo=1' : '';

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
      const isDemoMode = new URLSearchParams(window.location.search).get('demo') === '1';
      if (isDemoMode) {
        setProducts(DEMO_PRODUCTS);
        setIsLoading(false);
        return;
      }
      try {
        const token = localStorage.getItem('trms_token');

        if (!localStorage.getItem('market_tour_seen') && token) {
          setShowTour(true);
        }

        const params = new URLSearchParams();
        if (activeCategory !== 'All Listings') params.append('category', activeCategory);
        if (activeLocation !== 'All Origins') params.append('location', activeLocation);

        const { response: res, data } = await requestJson(`/api/products?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok && Array.isArray(data)) setProducts(data);
        else setProducts(DEMO_PRODUCTS);
      } catch (err) {
        console.error('Failed to fetch feed:', err);
        setProducts(DEMO_PRODUCTS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [activeLocation, activeCategory]);

  const completeTour = () => {
    localStorage.setItem('market_tour_seen', 'true');
    setShowTour(false);
  };

  const visibleProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let next = [...products];

    if (q) {
      next = next.filter((product) =>
        [product.title, product.category, product.description, product.campusLocation]
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
    }

    next.sort((a, b) => {
      if (sortBy === 'price-asc') return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === 'price-desc') return Number(b.price || 0) - Number(a.price || 0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return next;
  }, [products, searchQuery, sortBy]);

  return (
    <div className="w-full min-h-screen pb-32 transition-colors duration-500 font-sans bg-transparent">
      <div className="w-full border-b border-theme/15 bg-bg/35 backdrop-blur-sm pt-28 pb-2">
        <Marquee
          text="LPU MARKET  /  VERIFIED SELLERS  /  BUY LOCAL"
          className="text-[10px] tracking-[0.25em] text-theme/55"
        />
      </div>

      <header className="relative overflow-hidden border-b border-theme/10 bg-bg/15 px-5 py-12 sm:px-10 sm:py-16">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-accent">The campus exchange</p>
            <h1 className="text-4xl font-semibold leading-[0.95] tracking-[-0.07em] sm:text-6xl">Good finds.<br /><span className="text-theme/45">Better nearby.</span></h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-theme/60">Buy from people around you, sell what you no longer need, and keep campus life moving.</p>
          </div>
          <div className="grid max-w-md grid-cols-3 gap-2 sm:gap-3">
            {[['30+', 'live listings'], ['4', 'categories'], ['100%', 'campus first']].map(([value, label]) => <div key={label} className="glass-panel rounded-2xl p-4"><p className="text-xl font-semibold sm:text-2xl">{value}</p><p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-theme/45">{label}</p></div>)}
          </div>
        </div>
      </header>

      <div className="glass-panel sticky top-[88px] z-40 border-x-0 border-t-0 rounded-none px-4 sm:px-8 py-5 transition-colors duration-500">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide font-bold text-[14px]">
            {CATEGORIES.map((cat) => (
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

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search listings"
              className="glass-control w-full sm:w-64 rounded-full px-5 py-3 text-sm outline-none transition-colors"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="glass-control rounded-full px-5 py-3 text-sm outline-none transition-colors"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-5">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 text-[14px] font-bold text-theme uppercase hover:opacity-70 transition-opacity"
            >
              <span className="text-theme/40 text-xs">Origin:</span>
              {activeLocation}
              <span className={`text-[10px] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>v</span>
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="glass-panel absolute left-0 sm:left-auto sm:right-0 top-full mt-4 w-56 max-h-96 overflow-y-auto border-[2px] border-theme/20 z-50 flex flex-col rounded-2xl"
                >
                  {ALL_HOSTELS.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => {
                        setActiveLocation(loc);
                        setIsDropdownOpen(false);
                      }}
                      className={`px-6 py-4 text-left text-xs tracking-widest uppercase transition-colors ${
                        activeLocation === loc ? 'bg-theme text-bg' : 'text-theme hover:bg-theme/5'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="text-[9px] tracking-[0.35em] uppercase text-theme/35">
            {visibleProducts.length} results | {alerts?.length || 0} live signals
          </div>
        </div>
      </div>

      <div className="w-full">
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-theme border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-theme px-8 text-center">
            <div className="w-16 h-16 border-2 border-theme rounded-full flex items-center justify-center mb-6">
              <span className="text-2xl">!</span>
            </div>
            <h3 className="text-xl font-bold uppercase mb-2">No Artifacts Found</h3>
            <p className="text-sm text-theme/70 max-w-md">
              We couldn't locate anything matching your current filters. Try a different keyword or clear the active category.
            </p>
          </div>
        ) : (
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-5 py-8 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
            {visibleProducts.map((product, idx) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="glass-panel group relative flex flex-col rounded-[1.5rem] p-2 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.15rem] border border-theme/10 transition-colors duration-300 hover:border-accent">
                  <Link to={`/product/${product._id}${demoSuffix}`}>
                    <ProductImage src={product.images?.[0]} alt={product.title} title={product.title} className="h-full w-full transition duration-500 group-hover:scale-105" />
                  </Link>

                  {product.isVerifiedProduct && (
                    <div className="absolute top-4 left-4">
                      <StatusPill tone="good">Verified</StatusPill>
                    </div>
                  )}
                </div>

                <div className="py-4 flex flex-col justify-start">
                  <div>
                    <h3 className="line-clamp-2 text-[15px] font-semibold leading-tight">{product.title}</h3>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-theme/45">{product.category} · {product.campusLocation}</p>
                  </div>
                  <div className="mt-4 flex justify-between items-center gap-4">
                    <span className="text-lg font-semibold">Rs. {Number(product.price || 0).toLocaleString()}</span>
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

      {showTour && <TourOverlay onComplete={completeTour} />}
    </div>
  );
};

export default MarketFeed;
