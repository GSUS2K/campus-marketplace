import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Flag, ShieldCheck } from 'lucide-react';
import { CONDITION_LABELS } from '../constants';
import { DEMO_PRODUCTS } from '../data/demoContent';
import { requestJson } from '../lib/api';
import { ProductImage, StatusPill } from '../components/Ui';


const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('misleading_listing');
  const [reportDetails, setReportDetails] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      const isDemoMode = new URLSearchParams(window.location.search).get('demo') === '1';
      if (isDemoMode) {
        setProduct(DEMO_PRODUCTS.find((item) => item._id === id) || DEMO_PRODUCTS[0]);
        setIsLoading(false);
        return;
      }
      try {
        const { response: res, data } = await requestJson(`/api/products/${id}`);
        if (!res.ok) throw new Error('Artifact not found.');
        setProduct(data);
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

    const demoSuffix = new URLSearchParams(window.location.search).get('demo') === '1' ? '&demo=1' : '';
    navigate(`/chat?productId=${product._id}&product=${encodeURIComponent(product.title)}${demoSuffix}`);
  };

  const submitReport = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('trms_token');
    if (!token) { toast.error('Sign in to report a listing.'); navigate('/login'); return; }
    const { response, data } = await requestJson('/api/reports', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ targetType: 'Product', targetId: product._id, reason: reportReason, details: reportDetails }) });
    if (!response.ok) { toast.error(data.msg || 'Could not submit report.'); return; }
    setReportOpen(false); setReportDetails(''); toast.success('Safety report sent to the moderation team.');
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
          Return to Market
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
          <div className="w-full aspect-[4/5] overflow-hidden rounded-[2rem] border border-theme/10">
            <ProductImage src={product.images?.[activeImg]} alt={product.title} title={product.title} className="h-full w-full" />
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
            <div className="mb-3 flex items-center gap-2"><StatusPill tone="neutral">{product.category}</StatusPill>{product.isVerifiedProduct && <StatusPill tone="good">Verified</StatusPill>}</div>
            <h1 className="text-4xl font-semibold leading-tight tracking-[-0.06em] md:text-5xl">{product.title}</h1>
            <p className="mt-4 text-3xl font-semibold">Rs. {Number(product.price || 0).toLocaleString()}</p>
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

            <div className="glass-panel border-theme/15 rounded-[2rem] p-6">
            <p className="text-[9px] tracking-[0.4em] uppercase text-theme/30 mb-4">Curator Identity</p>
            <p className="text-xl font-serif">{product.seller?.name || 'Anonymous'}</p>
            <div className="flex justify-between mt-3 text-xs uppercase tracking-widest">
              <span className="text-theme/40">Trust Score</span>
              <span>{product.seller?.trustScore ?? 0}/100</span>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-emerald-500/10 p-3 text-xs text-theme/65"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-500" /><span>{product.seller?.isTrustedSeller ? 'Trusted seller: strong completed-transaction history.' : 'Newer seller: keep chat on-platform and use the verified handover flow.'}</span></div>

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
            <button type="button" onClick={() => setReportOpen((open) => !open)} className="mt-5 flex items-center gap-2 text-xs text-theme/45 transition hover:text-theme"><Flag size={14} /> Report a safety concern</button>
            {reportOpen && <form onSubmit={submitReport} className="mt-4 space-y-3 rounded-2xl border border-theme/10 bg-theme/5 p-4"><label className="block text-xs font-semibold text-theme/55">What should moderators review?<select value={reportReason} onChange={(event) => setReportReason(event.target.value)} className="glass-control mt-2 w-full rounded-xl px-3 py-2 text-sm outline-none"><option value="misleading_listing">Misleading listing</option><option value="fraud">Possible fraud</option><option value="counterfeit">Counterfeit item</option><option value="unsafe_meetup">Unsafe meetup request</option><option value="other">Other</option></select></label><textarea value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} maxLength={1000} rows={3} placeholder="Add context for the safety team (optional)" className="glass-control w-full rounded-xl px-3 py-2 text-sm outline-none" /><button className="button-primary w-full justify-center" type="submit">Send report</button></form>}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetail;
