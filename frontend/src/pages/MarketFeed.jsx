import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BookOpen, Heart, Laptop, MapPin, ShieldCheck, Shirt, ShoppingBag, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Marquee from '../components/Marquee';
import { CATEGORIES, HOSTEL_GROUPS } from '../constants';
import { DEMO_PRODUCTS } from '../data/demoContent';
import { requestJson } from '../lib/api';
import { ProductImage, StatusPill } from '../components/Ui';

const ALL_HOSTELS = ['All Origins', ...Object.values(HOSTEL_GROUPS).flat()];
const COLLECTIONS = [
  { category: 'Books', label: 'Study reset', description: 'Notes, calculators, books, and project gear', icon: BookOpen },
  { category: 'Electronics', label: 'Tech on campus', description: 'Devices that still have a lot left to give', icon: Laptop },
  { category: 'Apparel', label: 'Wear it again', description: 'Good clothes with a second campus life', icon: Shirt },
  { category: 'Miscellaneous', label: 'Useful nearby', description: 'Everyday essentials without the delivery wait', icon: Sparkles }
];

const productHref = (id, demoSuffix) => `/product/${id}${demoSuffix}`;

const CatalogCard = ({ product, index, demoSuffix, saved, onToggleSaved }) => {
  const [activeImage, setActiveImage] = useState(0);
  const images = product.images?.filter(Boolean).length ? product.images.filter(Boolean) : [''];
  const imageIndex = Math.min(activeImage, images.length - 1);

  const addToBag = (event) => {
    event.preventDefault();
    const token = localStorage.getItem('trms_token');
    const demo = new URLSearchParams(window.location.search).get('demo') === '1';
    if (!token && !demo) { toast.error('Sign in to save items to your bag.'); return; }
    const cart = JSON.parse(localStorage.getItem('outfit_cart') || '[]');
    if (cart.some((item) => item._id === product._id)) { toast.success('This listing is already in your bag.'); return; }
    cart.push(product);
    localStorage.setItem('outfit_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success(`${product.title} added to Bag`);
  };

  return <motion.article initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: Math.min(index * 0.035, 0.3) }} className="catalog-card group relative">
    <div className="relative aspect-[4/5] overflow-hidden rounded-[1.45rem] bg-theme/8" onMouseEnter={() => images.length > 1 && setActiveImage(1)} onMouseLeave={() => setActiveImage(0)}>
      <Link to={productHref(product._id, demoSuffix)} className="absolute inset-0 block" aria-label={`View ${product.title}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={`${product._id}-${imageIndex}`} initial={{ opacity: 0, scale: 1.035 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.985 }} transition={{ duration: 0.38, ease: 'easeOut' }} className="absolute inset-0"><ProductImage src={images[imageIndex]} alt={product.title} title={product.title} className="h-full w-full" /></motion.div>
        </AnimatePresence>
      </Link>
      <div className="absolute left-3 top-3 flex items-center gap-2">{product.isVerifiedProduct && <StatusPill tone="good">Verified</StatusPill>}</div>
      <button type="button" onClick={() => onToggleSaved(product._id)} aria-label={saved ? 'Remove from saved listings' : 'Save listing'} className={`absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border backdrop-blur-md transition ${saved ? 'border-rose-400/40 bg-rose-400/90 text-white' : 'border-white/35 bg-black/20 text-white hover:bg-white hover:text-black'}`}><Heart size={16} fill={saved ? 'currentColor' : 'none'} /></button>
      <div className="absolute bottom-3 left-3 right-3 flex translate-y-2 items-center justify-between opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <span className="rounded-full bg-black/55 px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md">{product.condition?.replace('_', ' ') || 'Good condition'}</span>
        <button onClick={addToBag} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-black shadow-lg"><ShoppingBag size={14} /> Add</button>
      </div>
      {images.length > 1 && <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">{images.map((_, imageNumber) => <button key={imageNumber} aria-label={`Show photo ${imageNumber + 1}`} onClick={(event) => { event.preventDefault(); setActiveImage(imageNumber); }} className={`h-1.5 rounded-full transition-all ${imageIndex === imageNumber ? 'w-5 bg-white' : 'w-1.5 bg-white/55 hover:bg-white'}`} />)}</div>}
    </div>
    <div className="px-1 pb-1 pt-4"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-theme/45">{product.category}</p><Link to={productHref(product._id, demoSuffix)} className="block"><h3 className="line-clamp-2 text-[15px] font-semibold leading-[1.12] tracking-[-0.03em] transition group-hover:text-accent">{product.title}</h3></Link></div><span className="shrink-0 text-base font-semibold tracking-[-0.04em]">Rs. {Number(product.price || 0).toLocaleString()}</span></div><div className="mt-3 flex items-center justify-between text-[11px] text-theme/50"><span className="inline-flex items-center gap-1"><MapPin size={12} />{product.campusLocation}</span><span>{product.seller?.trustScore ? `${product.seller.trustScore} trust` : 'Campus listed'}</span></div></div>
  </motion.article>;
};

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
  const [feedError, setFeedError] = useState('');
  const [activeLocation, setActiveLocation] = useState('All Origins');
  const [activeCategory, setActiveCategory] = useState('All Listings');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [savedListings, setSavedListings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('saved_listings') || '[]'); } catch { return []; }
  });
  const dropdownRef = useRef(null);
  const sortRef = useRef(null);
  const { alerts } = useSocket();
  const demoSuffix = new URLSearchParams(window.location.search).get('demo') === '1' ? '?demo=1' : '';

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target)) setIsSortOpen(false);
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setFeedError('');
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
        else {
          setProducts([]);
          setFeedError(data.msg || 'Listings could not be loaded.');
        }
      } catch (err) {
        console.error('Failed to fetch feed:', err);
        setProducts([]);
        setFeedError(err.message || 'The marketplace is temporarily unavailable.');
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

  const toggleSaved = (id) => {
    setSavedListings((current) => {
      const next = current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id];
      localStorage.setItem('saved_listings', JSON.stringify(next));
      toast.success(current.includes(id) ? 'Removed from saved listings.' : 'Saved for later.');
      return next;
    });
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
          text="CAMPUS PICKS  /  VERIFIED PEOPLE  /  BUY LOCAL  /  SELL SIMPLY  /  MEET SAFELY  /  CLEAR HANDOVERS  /  CAMPUS-FIRST COMMERCE"
          speed="fast"
          className="py-1 text-[10px] font-semibold tracking-[0.24em] text-theme/55"
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
            {[[isLoading ? '—' : `${products.length}`, 'verified listings'], [`${CATEGORIES.length - 1}`, 'categories'], ['LPU', 'campus only']].map(([value, label]) => <div key={label} className="glass-panel rounded-2xl p-4"><p className="text-xl font-semibold sm:text-2xl">{value}</p><p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-theme/45">{label}</p></div>)}
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-3 px-5 py-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        {COLLECTIONS.map(({ category, label, description, icon: Icon }) => <button key={category} onClick={() => { setActiveCategory(category); window.scrollTo({ top: 520, behavior: 'smooth' }); }} className="group glass-panel rounded-2xl p-4 text-left transition hover:-translate-y-0.5 hover:border-accent/40"><div className="flex items-start justify-between"><Icon size={18} className="text-accent" /><ArrowRight size={16} className="text-theme/35 transition group-hover:translate-x-1 group-hover:text-theme" /></div><h2 className="mt-7 text-base font-semibold normal-case tracking-[-0.03em]">{label}</h2><p className="mt-1 text-xs leading-relaxed text-theme/55">{description}</p></button>)}
      </section>

      <section className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-5 pb-5 sm:px-8"><span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-theme/40">Popular on campus</span>{['calculator', 'hostel', 'notes', 'headphones', 'hoodie'].map((term) => <button key={term} onClick={() => setSearchQuery(term)} className="rounded-full border border-theme/12 px-3 py-1.5 text-xs text-theme/65 transition hover:border-accent/40 hover:text-theme">{term}</button>)}</section>

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
            <div className="relative" ref={sortRef}>
              <button type="button" onClick={() => setIsSortOpen((open) => !open)} aria-haspopup="listbox" aria-expanded={isSortOpen} className="glass-control flex w-full items-center justify-between gap-8 rounded-full px-5 py-3 text-left text-sm outline-none transition-colors sm:w-56">
                <span>{sortBy === 'newest' ? 'Newest' : sortBy === 'price-asc' ? 'Price: Low to High' : 'Price: High to Low'}</span>
                <span className={`text-xs transition-transform ${isSortOpen ? 'rotate-180' : ''}`}>⌄</span>
              </button>
              <AnimatePresence>
                {isSortOpen && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="glass-panel absolute right-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl p-1 sm:w-56" role="listbox">
                  {[['newest', 'Newest'], ['price-asc', 'Price: Low to High'], ['price-desc', 'Price: High to Low']].map(([value, label]) => <button type="button" role="option" aria-selected={sortBy === value} key={value} onClick={() => { setSortBy(value); setIsSortOpen(false); }} className={`w-full rounded-xl px-4 py-3 text-left text-sm transition ${sortBy === value ? 'bg-theme text-bg' : 'text-theme/75 hover:bg-theme/10 hover:text-theme'}`}>{label}</button>)}
                </motion.div>}
              </AnimatePresence>
            </div>
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
            {visibleProducts.length} results <span className="px-1 text-theme/20">|</span> {alerts?.length || 0} live signals
          </div>
        </div>
      </div>

      <div className="w-full">
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-theme border-t-transparent rounded-full animate-spin" />
          </div>
        ) : feedError ? (
          <div className="mx-auto my-10 max-w-3xl px-5"><div role="alert" className="glass-panel rounded-3xl border border-amber-500/30 p-8 text-center sm:p-12"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Marketplace connection issue</p><h3 className="mt-3 text-2xl font-semibold">We couldn’t load live listings.</h3><p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-theme/60">{feedError} Preview Mode has sample listings, but this page will not mix sample data into live results.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><button onClick={() => window.location.reload()} className="button-primary">Try again</button><Link to="/?demo=1" className="button-secondary">Open sample marketplace</Link></div></div></div>
        ) : visibleProducts.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-theme px-8 text-center">
            <div className="w-16 h-16 border-2 border-theme rounded-full flex items-center justify-center mb-6">
              <span className="text-2xl">!</span>
            </div>
            <h3 className="text-xl font-bold mb-2">No listings match those filters</h3>
            <p className="text-sm text-theme/70 max-w-md">
              We couldn't locate anything matching your current filters. Try a different keyword or clear the active category.
            </p>
          </div>
        ) : (
          <div className="catalog-grid mx-auto grid max-w-7xl grid-cols-1 gap-x-5 gap-y-10 px-5 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
            {visibleProducts.map((product, idx) => <CatalogCard key={product._id} product={product} index={idx} demoSuffix={demoSuffix} saved={savedListings.includes(product._id)} onToggleSaved={toggleSaved} />)}
          </div>
        )}
      </div>

      <section className="mx-auto mt-8 grid max-w-7xl gap-4 px-5 sm:grid-cols-3 sm:px-8"><div className="glass-panel rounded-2xl p-5"><ShieldCheck size={18} className="text-accent" /><h2 className="mt-4 text-base font-semibold normal-case">Verified before visible</h2><p className="mt-2 text-sm leading-relaxed text-theme/55">Listings are reviewed before they appear in the live feed.</p></div><div className="glass-panel rounded-2xl p-5"><span className="text-xl">01</span><h2 className="mt-4 text-base font-semibold normal-case">Keep pickup clear</h2><p className="mt-2 text-sm leading-relaxed text-theme/55">Orders use a shared handover code so both people confirm the exchange.</p></div><div className="glass-panel rounded-2xl p-5"><span className="text-xl">02</span><h2 className="mt-4 text-base font-semibold normal-case">Get help early</h2><p className="mt-2 text-sm leading-relaxed text-theme/55">Report a concern or request mediation when a conversation needs campus support.</p></div></section>

      {showTour && <TourOverlay onComplete={completeTour} />}
    </div>
  );
};

export default MarketFeed;
