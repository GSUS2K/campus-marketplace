import React, { useEffect, useMemo, useState } from 'react';
import { Check, Flag, Search, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { DEMO_PENDING_PRODUCTS } from '../data/demoContent';
import { requestJson } from '../lib/api';
import { PageIntro, ProductImage, StatCard, StatusPill } from '../components/Ui';

const AdminDashboard = () => {
  const [pendingProducts, setPendingProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('trms_user') || '{}');
  const isDemoMode = new URLSearchParams(window.location.search).get('demo') === '1';

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem('trms_token');
      const { response, data } = await requestJson('/api/products/admin/pending', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error(data.msg || 'Queue unavailable');
      setPendingProducts(data);
      setIsPreview(false);
    } catch (_error) {
      setPendingProducts(DEMO_PENDING_PRODUCTS);
      setIsPreview(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (user.role !== 'admin' && !isDemoMode) { navigate('/'); return; } fetchPending(); }, [navigate, user.role, isDemoMode]);

  const actOnProduct = async (productId, action) => {
    try {
      if (isPreview) { setPendingProducts((items) => items.filter((item) => item._id !== productId)); toast.success(action === 'verify' ? 'Preview listing approved' : 'Preview listing flagged'); return; }
      const token = localStorage.getItem('trms_token');
      const { response, data } = await requestJson(`/api/products/admin/${action}/${productId}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error(data.msg || 'Action failed');
      setPendingProducts((items) => items.filter((item) => item._id !== productId));
      toast.success(action === 'verify' ? 'Listing approved' : 'Listing flagged');
    } catch (error) { toast.error(error.message); }
  };

  const filteredProducts = useMemo(() => pendingProducts.filter((item) => `${item.title} ${item.category} ${item.seller?.name || ''}`.toLowerCase().includes(search.toLowerCase())), [pendingProducts, search]);

  return <div className="mx-auto min-h-screen max-w-7xl px-5 pb-24 pt-8 sm:px-8">
    <PageIntro eyebrow="Trust & safety" title="Review queue" description="Keep the marketplace useful by approving clear, authentic listings and flagging anything that needs a closer look." action={<button onClick={fetchPending} className="rounded-xl border border-theme/15 px-4 py-3 text-sm font-medium hover:bg-theme/8">Refresh queue</button>} />
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3"><StatCard label="Needs review" value={pendingProducts.length} note="Listings waiting for a decision" icon={<ShieldCheck size={18} />} /><StatCard label="High attention" value={pendingProducts.filter((item) => item.riskLevel === 'high').length} note="Prioritize these first" icon={<Flag size={18} />} /><StatCard label="Queue mode" value={isPreview ? 'Preview' : 'Live'} note="Actions are clearly labeled" /></div>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="glass-control flex items-center gap-3 rounded-xl px-4 py-3 sm:w-80"><Search size={16} className="text-theme/40" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search queue" className="w-full bg-transparent text-sm outline-none placeholder:text-theme/40" /></div>{isPreview && <StatusPill tone="warn">Preview data · actions are local</StatusPill>}</div>
    {isLoading ? <div className="glass-panel rounded-3xl p-16 text-center text-sm text-theme/50">Loading review queue...</div> : filteredProducts.length === 0 ? <div className="glass-panel rounded-3xl p-16 text-center"><ShieldCheck className="mx-auto mb-4 text-emerald-500" /><p className="font-medium">All clear</p><p className="mt-1 text-sm text-theme/50">No listings match this queue.</p></div> : <div className="space-y-4">{filteredProducts.map((product) => <article key={product._id} className="glass-panel grid gap-5 rounded-3xl p-4 sm:p-5 lg:grid-cols-[160px_1fr_auto] lg:items-center"><ProductImage src={product.images?.[0]} alt={product.title} title={product.title} className="h-44 w-full rounded-2xl lg:h-32" /><div><div className="flex flex-wrap items-center gap-2"><StatusPill tone={product.riskLevel === 'high' ? 'danger' : 'neutral'}>{product.riskLevel || 'review'}</StatusPill><span className="text-xs text-theme/45">{product.category} · {product.campusLocation}</span></div><h2 className="mt-3 text-xl font-semibold">{product.title}</h2><p className="mt-2 line-clamp-2 text-sm leading-relaxed text-theme/55">{product.description}</p><p className="mt-3 text-sm font-semibold">Rs. {Number(product.price || 0).toLocaleString()} <span className="font-normal text-theme/45">· {product.seller?.name || 'Unknown seller'}</span></p></div><div className="flex gap-2 lg:flex-col"><button onClick={() => actOnProduct(product._id, 'verify')} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-theme px-4 py-3 text-sm font-semibold text-bg"><Check size={15} />Approve</button><button onClick={() => actOnProduct(product._id, 'flag')} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-theme/15 px-4 py-3 text-sm font-semibold hover:bg-theme/8"><Flag size={15} />Flag</button></div></article>)}</div>}
  </div>;
};

export default AdminDashboard;
