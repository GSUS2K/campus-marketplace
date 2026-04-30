import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

import { CONDITION_LABELS } from '../constants';

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
        const token = localStorage.getItem('trms_token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Artifact not found or access denied.');
        setProduct(await res.json());
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (isLoading) {
    return (
      <div className="w-full bg-cream dark:bg-void min-h-screen pt-32 flex justify-center">
        <p className="text-[10px] tracking-[0.4em] uppercase text-theme/30 animate-pulse">Decrypting Artifact…</p>
      </div>
    );
  }

  if (errorMsg || !product) {
    return (
      <div className="w-full bg-cream dark:bg-void min-h-screen pt-32 flex flex-col items-center gap-6">
        <p className="text-[10px] tracking-[0.4em] uppercase text-shu_light dark:text-shu_dark">{errorMsg}</p>
        <button onClick={() => navigate('/')} className="text-xs uppercase tracking-widest text-theme/50 hover:text-theme border-b border-theme/20 pb-1 transition-colors">← Return to Archive</button>
      </div>
    );
  }

  return (
    <div className="w-full bg-transparent text-theme min-h-screen animate-fade-in transition-colors duration-300">

      {/* Back Button */}
      <div className="px-8 sm:px-14 pt-8">
        <button onClick={() => navigate(-1)} className="text-[9px] tracking-[0.3em] uppercase text-theme/40 hover:text-theme transition-colors">
          ← Back
        </button>
      </div>

      <div className="max-w-[1300px] mx-auto px-8 sm:px-14 py-12 grid grid-cols-1 lg:grid-cols-2 gap-16 overflow-hidden">

        {/* ── Left: Gallery ──────────────────────────── */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-4">
          {/* Main image */}
          <div className="w-full aspect-[4/5] bg-border_light dark:bg-border_dark overflow-hidden">
            <img
              src={product.images?.[activeImg]}
              alt={product.title}
              className="w-full h-full object-cover transition-opacity duration-500"
            />
          </div>

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImg(idx)}
                  className={`shrink-0 w-20 aspect-square overflow-hidden border-2 transition-colors ${
                    activeImg === idx
                      ? 'border-theme'
                      : 'border-transparent hover:border-theme/30'
                  }`}
                >
                  <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Right: Details ─────────────────────────── */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="flex flex-col gap-10 pt-4">

          <div>
            <p className="text-[9px] tracking-[0.4em] uppercase text-theme/40 mb-3">{product.category}</p>
            <h1 className="text-4xl md:text-5xl font-serif font-light leading-tight">{product.title}</h1>
            <p className="text-3xl font-serif mt-4">₹{product.price?.toLocaleString()}</p>
          </div>

          {/* Condition */}
          <div className="border-t border-theme/40 pt-8">
            <p className="text-[9px] tracking-[0.4em] uppercase text-theme/30 mb-2">Condition</p>
            <p className="text-sm tracking-wide">{CONDITION_LABELS[product.condition] || product.condition}</p>
          </div>

          {/* Description */}
          <div className="border-t border-theme/40 pt-8">
            <p className="text-[9px] tracking-[0.4em] uppercase text-theme/30 mb-3">Provenance</p>
            <p className="text-sm font-sans font-light leading-relaxed text-theme/80">{product.description}</p>
          </div>

          {/* Network Info */}
          <div className="border-t border-theme/40 pt-8 space-y-3">
            <p className="text-[9px] tracking-[0.4em] uppercase text-theme/30 mb-4">Network Data</p>
            {[
              ['Origin', product.campusLocation],
              ['Date Logged', new Date(product.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })],
              ['Status', product.isVerifiedProduct ? 'Authenticated' : 'Pending Review'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs tracking-widest uppercase">
                <span className="text-theme/40">{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>

          {/* Seller */}
          <div className="border border-theme/40 p-6">
            <p className="text-[9px] tracking-[0.4em] uppercase text-theme/30 mb-4">Curator Identity</p>
            <p className="text-xl font-serif">{product.seller?.name || 'Anonymous'}</p>
            <div className="flex justify-between mt-3 text-xs uppercase tracking-widest">
              <span className="text-theme/40">Trust Score</span>
              <span>{product.seller?.trustScore ?? 0}/100</span>
            </div>
            <div className="flex gap-4 mt-6">
              <button 
                onClick={() => {
                  const cart = JSON.parse(localStorage.getItem('outfit_cart') || '[]');
                  cart.push(product);
                  localStorage.setItem('outfit_cart', JSON.stringify(cart));
                  window.dispatchEvent(new Event('cartUpdated'));
                  toast.success(`${product.title} added to Bag`);
                }}
                className="flex-1 py-4 border border-theme text-theme text-[9px] tracking-[0.4em] uppercase hover:bg-theme hover:text-bg transition-colors"
              >
                Add to Bag
              </button>
              <button 
                onClick={() => navigate(`/chat?sellerId=${product.seller?._id}&product=${product.title}`)}
                className="flex-1 py-4 bg-theme text-bg text-[9px] tracking-[0.4em] uppercase hover:opacity-80 transition-opacity"
              >
                Initiate Secure Channel
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetail;
