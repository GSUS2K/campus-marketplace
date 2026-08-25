import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { DEMO_LISTINGS, DEMO_USER } from '../data/demoContent';
import { requestJson } from '../lib/api';
import { PageIntro, ProductImage, StatCard, StatusPill } from '../components/Ui';

export default function Profile() {
  const isDemo = new URLSearchParams(window.location.search).get('demo') === '1';
  const user = JSON.parse(localStorage.getItem('trms_user') || JSON.stringify(DEMO_USER));
  const isAdmin = user.role === 'admin';
  const isSeller = user.role === 'seller';
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(!isAdmin);

  useEffect(() => {
    if (isAdmin) { setLoading(false); return; }
    if (isDemo) { setListings(DEMO_LISTINGS); setLoading(false); return; }
    requestJson('/api/products/me', { headers: { Authorization: `Bearer ${localStorage.getItem('trms_token')}` } })
      .then(({ response, data }) => { if (response.ok && Array.isArray(data)) setListings(data); else toast.error(data.msg || 'Could not load your listings.'); })
      .catch(() => toast.error('Could not connect to your listings.'))
      .finally(() => setLoading(false));
  }, [isAdmin, isDemo]);

  const removeListing = async (id) => {
    if (isDemo) { setListings((items) => items.filter((item) => item._id !== id)); toast.success('Preview listing removed.'); return; }
    const { response, data } = await requestJson(`/api/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('trms_token')}` } });
    if (!response.ok) { toast.error(data.msg || 'Could not remove listing.'); return; }
    setListings((items) => items.filter((item) => item._id !== id)); toast.success('Listing removed.');
  };

  const logout = () => { localStorage.removeItem('trms_token'); localStorage.removeItem('trms_user'); navigate('/login'); };
  const navigate = useNavigate();

  return <section className="page-shell">
    <PageIntro eyebrow={isAdmin ? 'Administration' : isSeller ? 'Seller space' : 'Buyer space'} title={user.name || 'Your space'} description={`${user.email || 'Demo account'} · ${user.campusLocation || 'Campus member'}`} action={isAdmin ? <Link to="/admin" className="button-primary"><ShieldCheck size={15} /> Open moderation</Link> : <Link to="/post" className="button-primary"><Plus size={15} /> New listing</Link>} />
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3"><StatCard label="Trust score" value={`${user.trustScore ?? 0}/100`} note="Reputation signal" /><StatCard label={isAdmin ? 'Verified sellers' : 'Your listings'} value={isAdmin ? 'Moderation' : listings.length} note={isAdmin ? 'Review access requests' : 'Including pending review'} /><StatCard label="Identity" value={user.status === 'verified' ? 'Verified' : 'Pending'} note={user.campusLocation || 'Campus member'} /></div>
    <div className="mb-10 grid gap-4 md:grid-cols-[1.4fr_0.6fr]"><div className="glass-panel rounded-3xl p-6"><p className="eyebrow">Account details</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><p className="text-xs text-theme/45">Email</p><p className="mt-1 text-sm font-semibold">{user.email}</p></div><div><p className="text-xs text-theme/45">Campus location</p><p className="mt-1 text-sm font-semibold">{user.campusLocation || 'Not set'}</p></div><div><p className="text-xs text-theme/45">Role</p><p className="mt-1 text-sm font-semibold capitalize">{user.role}</p></div><div><p className="text-xs text-theme/45">Access</p><p className="mt-1"><StatusPill tone={user.status === 'verified' ? 'good' : 'warn'}>{user.status || 'pending'}</StatusPill></p></div></div></div><div className="glass-panel rounded-3xl p-6"><p className="eyebrow">Workspace</p><div className="mt-5 space-y-2">{isAdmin && <Link to="/admin" className="button-secondary w-full justify-center"><ShieldCheck size={15} /> Moderation queue</Link>}<Link to="/analytics" className="button-secondary w-full justify-center"><LayoutDashboard size={15} /> {isSeller ? 'Seller insights' : 'Buyer insights'}</Link><Link to="/orders" className="button-secondary w-full justify-center">View orders</Link></div></div></div>
    {!isAdmin && <div><div className="mb-5 flex items-end justify-between"><div><p className="eyebrow">Seller inventory</p><h2 className="mt-2 text-2xl font-semibold">Your listings</h2></div><span className="text-xs text-theme/45">{listings.length} total</span></div>{loading ? <div className="glass-panel rounded-3xl p-12 text-center text-sm text-theme/50">Loading listings...</div> : listings.length === 0 ? <div className="glass-panel rounded-3xl p-12 text-center"><p className="font-semibold">No listings yet</p><p className="mt-1 text-sm text-theme/50">Create your first listing to start selling on campus.</p></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{listings.map((product) => <article key={product._id} className="glass-panel overflow-hidden rounded-3xl"><Link to={`/product/${product._id}`}><ProductImage src={product.images?.[0]} alt={product.title} title={product.title} className="aspect-[4/5] w-full transition-transform duration-500 hover:scale-105" /></Link><div className="p-4"><div className="flex items-start justify-between gap-3"><h3 className="line-clamp-2 text-sm font-semibold">{product.title}</h3><span className="shrink-0 text-sm font-semibold">Rs. {Number(product.price || 0).toLocaleString()}</span></div><div className="mt-3 flex items-center justify-between gap-2"><StatusPill tone={product.status === 'active' ? 'good' : product.status === 'flagged' ? 'danger' : 'warn'}>{product.status === 'pending_review' ? 'Pending review' : product.status}</StatusPill>{product.isVerifiedProduct && <span className="text-[9px] uppercase tracking-[0.15em] text-theme/45">Approved</span>}</div><button onClick={() => removeListing(product._id)} className="mt-4 flex w-full items-center justify-center gap-2 border-t border-theme/10 pt-3 text-xs text-theme/50 hover:text-theme"><Trash2 size={13} /> Remove</button></div></article>)}</div>}</div>}
    <button onClick={logout} className="mt-14 border-t border-theme/10 pt-6 text-xs text-theme/45 hover:text-theme">Log out of this account</button>
  </section>;
}
