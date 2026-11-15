import React, { useEffect, useState } from 'react';
import { ClipboardList, LayoutDashboard, Plus, ShieldCheck, ShoppingBag, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { DEMO_LISTINGS, DEMO_USER } from '../data/demoContent';
import { requestJson } from '../lib/api';
import { PageIntro, ProductImage, StatCard, StatusPill } from '../components/Ui';

const roleCopy = {
  buyer: { eyebrow: 'Buyer space', title: 'Your campus marketplace', description: 'Track purchases, use the need board, and keep every pickup clear.' },
  seller: { eyebrow: 'Seller space', title: 'Your seller workspace', description: 'Manage your listings, handovers, and real demand signals in one place.' },
  intermediary: { eyebrow: 'Verification team', title: 'Your casework workspace', description: 'Review assigned listings, handle reports, and support safe handovers.' },
  admin: { eyebrow: 'Marketplace administration', title: 'Marketplace control room', description: 'Manage access, moderation, and marketplace health without mixing it with seller inventory.' }
};

export default function Profile() {
  const navigate = useNavigate();
  const isDemo = new URLSearchParams(window.location.search).get('demo') === '1';
  const user = JSON.parse(localStorage.getItem('trms_user') || JSON.stringify(DEMO_USER));
  const token = localStorage.getItem('trms_token');
  const role = roleCopy[user.role] ? user.role : 'buyer';
  const isSeller = role === 'seller';
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(isSeller);

  useEffect(() => {
    if (!isSeller) { setLoading(false); return; }
    if (isDemo && !token) { setListings(DEMO_LISTINGS); setLoading(false); return; }
    requestJson('/api/products/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ response, data }) => {
        if (response.ok && Array.isArray(data)) setListings(data);
        else toast.error(data.msg || 'Could not load your listings.');
      })
      .catch(() => toast.error('Could not connect to your listings.'))
      .finally(() => setLoading(false));
  }, [isSeller, isDemo, token]);

  const removeListing = async (id) => {
    if (isDemo && !token) { setListings((items) => items.filter((item) => item._id !== id)); toast.success('Preview listing removed.'); return; }
    const { response, data } = await requestJson(`/api/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) { toast.error(data.msg || 'Could not remove listing.'); return; }
    setListings((items) => items.filter((item) => item._id !== id));
    toast.success('Listing removed.');
  };

  const logout = () => { localStorage.removeItem('trms_token'); localStorage.removeItem('trms_user'); localStorage.removeItem('outfit_cart'); navigate('/login'); };
  const workspaceActions = role === 'seller'
    ? [{ to: '/post', label: 'Create listing', icon: <Plus size={15} /> }, { to: '/orders', label: 'Manage sales', icon: <ClipboardList size={15} /> }, { to: '/analytics', label: 'Seller insights', icon: <LayoutDashboard size={15} /> }]
    : role === 'intermediary'
      ? [{ to: '/admin', label: 'Open verification desk', icon: <ShieldCheck size={15} /> }, { to: '/analytics', label: 'Marketplace signals', icon: <LayoutDashboard size={15} /> }, { to: '/orders', label: 'View handovers', icon: <ClipboardList size={15} /> }]
      : role === 'admin'
        ? [{ to: '/admin', label: 'Open moderation desk', icon: <ShieldCheck size={15} /> }, { to: '/analytics', label: 'Marketplace analytics', icon: <LayoutDashboard size={15} /> }]
        : [{ to: '/orders', label: 'View purchases', icon: <ShoppingBag size={15} /> }, { to: '/requests', label: 'Post a need', icon: <Plus size={15} /> }, { to: '/analytics', label: 'Buyer insights', icon: <LayoutDashboard size={15} /> }];
  const copy = roleCopy[role];

  return <section className="page-shell">
    <PageIntro eyebrow={copy.eyebrow} title={copy.title} description={`${user.name || 'Campus member'} · ${user.email || 'Demo account'} · ${copy.description}`} action={workspaceActions[0] && <Link to={`${workspaceActions[0].to}${isDemo ? '?demo=1' : ''}`} className="button-primary">{workspaceActions[0].icon}{workspaceActions[0].label}</Link>} />
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard label="Trust score" value={`${user.trustScore ?? 50}/100`} note="Earned from verified activity" />
      <StatCard label={isSeller ? 'Active listings' : role === 'intermediary' ? 'Assigned work' : role === 'admin' ? 'Access level' : 'Account type'} value={isSeller ? listings.filter((item) => item.status === 'active').length : role === 'intermediary' ? 'Reviewer' : role === 'admin' ? 'Administrator' : 'Buyer'} note={isSeller ? 'Visible on the feed' : 'Role-based marketplace access'} />
      <StatCard label="Identity" value={user.status === 'verified' ? 'Verified' : 'Pending'} note={user.campusLocation || 'LPU campus member'} />
    </div>
    <div className="mb-10 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
      <div className="glass-panel rounded-3xl p-6 sm:p-8"><p className="eyebrow">Account and safety</p><div className="mt-5 grid gap-5 sm:grid-cols-2"><div><p className="text-xs text-theme/45">Institutional email</p><p className="mt-1 break-all text-sm font-semibold">{user.email || 'Not available'}</p></div><div><p className="text-xs text-theme/45">Campus location</p><p className="mt-1 text-sm font-semibold">{user.campusLocation || 'Not set'}</p></div><div><p className="text-xs text-theme/45">Role</p><p className="mt-1 text-sm font-semibold capitalize">{role}</p></div><div><p className="text-xs text-theme/45">Account access</p><p className="mt-1"><StatusPill tone={user.status === 'verified' ? 'good' : 'warn'}>{user.status || 'pending'}</StatusPill></p></div></div></div>
      <div className="glass-panel rounded-3xl p-6 sm:p-8"><p className="eyebrow">Quick actions</p><div className="mt-5 space-y-2">{workspaceActions.map((action) => <Link key={action.label} to={`${action.to}${isDemo ? '?demo=1' : ''}`} className="button-secondary w-full justify-center">{action.icon}{action.label}</Link>)}</div></div>
    </div>
    {isSeller && <div><div className="mb-5 flex items-end justify-between"><div><p className="eyebrow">Seller inventory</p><h2 className="mt-2 text-2xl font-semibold">Your listings</h2></div><span className="text-xs text-theme/45">{listings.length} total</span></div>{loading ? <div className="glass-panel rounded-3xl p-12 text-center text-sm text-theme/50">Loading your listings...</div> : listings.length === 0 ? <div className="glass-panel rounded-3xl p-12 text-center"><p className="font-semibold">No listings yet</p><p className="mt-1 text-sm text-theme/50">Create your first listing to start selling on campus.</p></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{listings.map((product) => <article key={product._id} className="glass-panel overflow-hidden rounded-3xl"><Link to={`/product/${product._id}${isDemo ? '?demo=1' : ''}`}><ProductImage src={product.images?.[0]} alt={product.title} title={product.title} className="aspect-[4/5] w-full transition-transform duration-500 hover:scale-105" /></Link><div className="p-4"><div className="flex items-start justify-between gap-3"><h3 className="line-clamp-2 text-sm font-semibold">{product.title}</h3><span className="shrink-0 text-sm font-semibold">Rs. {Number(product.price || 0).toLocaleString()}</span></div><div className="mt-3 flex items-center justify-between gap-2"><StatusPill tone={product.status === 'active' ? 'good' : product.status === 'flagged' ? 'danger' : 'warn'}>{product.status === 'pending_review' ? 'Pending review' : product.status}</StatusPill>{product.isVerifiedProduct && <span className="text-[9px] uppercase tracking-[0.15em] text-theme/45">Verified</span>}</div><button onClick={() => removeListing(product._id)} className="mt-4 flex w-full items-center justify-center gap-2 border-t border-theme/10 pt-3 text-xs text-theme/50 hover:text-theme"><Trash2 size={13} /> Remove</button></div></article>)}</div>}</div>}
    {!isSeller && <div className="glass-panel rounded-3xl p-8"><p className="eyebrow">What this workspace is for</p><h2 className="mt-2 text-2xl font-semibold">{role === 'buyer' ? 'Buy confidently, then close the loop.' : role === 'intermediary' ? 'Independent campus verification.' : 'Transparent marketplace governance.'}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-theme/55">{role === 'buyer' ? 'Keep pickup codes private, report unsafe behaviour early, and use campus mediation when a handover needs support.' : role === 'intermediary' ? 'Use the verification desk for listings, reports, and mediated conversations. Your actions are recorded in the audit history.' : 'Use moderation to approve verified seller access, review queues, and audit marketplace decisions.'}</p></div>}
    <button onClick={logout} className="mt-14 border-t border-theme/10 pt-6 text-xs text-theme/45 hover:text-theme">Log out of this account</button>
  </section>;
}
