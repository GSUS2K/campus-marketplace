import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { CONDITION_LABELS } from '../constants';
import { DEMO_PRODUCTS } from '../data/demoContent';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products/${id}`);
        if (!res.ok) throw new Error('Artifact not found.');
        setProduct(await res.json());
      } catch (_err) {
        setProduct(DEMO_PRODUCTS.find((item) => item._id === id) || DEMO_PRODUCTS[0]);
        setErrorMsg('');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const imageCount = useMemo(() => product?.images?.length || 0, [product]);

  const handleAddToBag = () => {
    const cart = JSON.parse(localStorage.getItem('outfit_cart') || '[]');
    cart.push(product);
    localStorage.setItem('outfit_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success(`${product.title} added to Bag`);
  };

  const handleOpenChat = () => {
    const token = localStorage.getItem('trms_token');
    if (!token) {
      toast.error('Log in to start a secure channel');
      navigate('/login');
      return;
    }

    navigate(`/chat?productId=${product._id}&product=${encodeURIComponent(product.title)}`);
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen pt-32 flex justify-center text-theme">
        <p className="text-[10px] tracking-[0.4em] uppercase text-theme/30 animate-pulse">Decrypting Artifact...</p>
      </div>
    );
  }

  if (errorMsg || !product) {
    return (
      <div className="w-full min-h-screen pt-32 flex flex-col items-center gap-6 text-theme px-8">
        <p className="text-[10px] tracking-[0.4em] uppercase text-theme/60 text-center">
          {errorMsg || 'Artifact not available.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="text-xs uppercase tracking-widest text-theme/50 hover:text-theme border-b border-theme/20 pb-1 transition-colors"
        >
          Return to Archive
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-transparent text-theme min-h-screen animate-fade-in transition-colors duration-300">
      <div className="px-8 sm:px-14 pt-8">
        <button onClick={() => navigate(-1)} className="text-[9px] tracking-[0.3em] uppercase text-theme/40 hover:text-theme transition-colors">
          Back
        </button>
      </div>

      <div className="max-w-[1300px] mx-auto px-8 sm:px-14 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="space-y-4"
        >
          <div className="w-full aspect-[4/5] bg-theme/5 overflow-hidden rounded-[2rem] border border-theme/10">
            <img
              src={product.images?.[activeImg] || 'https://via.placeholder.com/800x1000?text=No+Image'}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>

          {imageCount > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImg(idx)}
                  className={`shrink-0 w-20 aspect-square overflow-hidden border-2 rounded-xl transition-colors ${
                    activeImg === idx ? 'border-theme' : 'border-transparent hover:border-theme/30'
                  }`}
                >
                  <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className="flex flex-col gap-8 pt-2"
        >
          <div>
            <p className="text-[9px] tracking-[0.4em] uppercase text-theme/40 mb-3">{product.category}</p>
            <h1 className="text-4xl md:text-5xl font-serif font-light leading-tight">{product.title}</h1>
            <p className="text-3xl font-serif mt-4">Rs. {Number(product.price || 0).toLocaleString()}</p>
          </div>

          <div className="border-t border-theme/20 pt-6">
            <p className="text-[9px] tracking-[0.4em] uppercase text-theme/30 mb-2">Condition</p>
            <p className="text-sm tracking-wide">{CONDITION_LABELS[product.condition] || product.condition}</p>
          </div>

          <div className="border-t border-theme/20 pt-6">
            <p className="text-[9px] tracking-[0.4em] uppercase text-theme/30 mb-3">Provenance</p>
            <p className="text-sm font-sans font-light leading-relaxed text-theme/80">{product.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-theme/20 pt-6">
            {[
              ['Origin', product.campusLocation],
              ['Date Logged', new Date(product.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })],
              ['Status', product.isVerifiedProduct ? 'Authenticated' : 'Pending Review']
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-theme/10 bg-theme/5 p-4">
                <p className="text-[9px] tracking-[0.4em] uppercase text-theme/30 mb-2">{k}</p>
                <p className="text-sm uppercase tracking-wide">{v}</p>
              </div>
            ))}
          </div>

          <div className="border border-theme/15 rounded-[2rem] p-6 bg-bg/85">
            <p className="text-[9px] tracking-[0.4em] uppercase text-theme/30 mb-4">Curator Identity</p>
            <p className="text-xl font-serif">{product.seller?.name || 'Anonymous'}</p>
            <div className="flex justify-between mt-3 text-xs uppercase tracking-widest">
              <span className="text-theme/40">Trust Score</span>
              <span>{product.seller?.trustScore ?? 0}/100</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              <button
                onClick={handleAddToBag}
                className="w-full py-4 border border-theme text-theme text-[9px] tracking-[0.4em] uppercase hover:bg-theme hover:text-bg transition-colors rounded-full"
              >
                Add to Bag
              </button>
              <button
                onClick={handleOpenChat}
                className="w-full py-4 bg-theme text-bg text-[9px] tracking-[0.4em] uppercase hover:opacity-80 transition-opacity rounded-full"
              >
                Start Secure Chat
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetail;
