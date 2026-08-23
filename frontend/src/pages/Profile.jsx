import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DEMO_LISTINGS, DEMO_USER } from '../data/demoContent';
import { API_BASE, requestJson } from '../lib/api';
import { PageIntro, ProductImage, StatCard, StatusPill } from '../components/Ui';


const Profile = () => {
  const [myListings, setMyListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('trms_user') || JSON.stringify(DEMO_USER));

  useEffect(() => {
    const fetchListings = async () => {
      const isDemoMode = new URLSearchParams(window.location.search).get('demo') === '1';
      if (isDemoMode) {
        setMyListings(DEMO_LISTINGS);
        setIsLoading(false);
        return;
      }
      try {
        const token = localStorage.getItem('trms_token');
        const { response: res, data } = await requestJson('/api/products/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok && Array.isArray(data)) setMyListings(data);
        else setMyListings(DEMO_LISTINGS);
      } catch (err) {
        console.error('Failed to fetch listings', err);
        setMyListings(DEMO_LISTINGS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, []);

  const handleRemoveListing = async (productId) => {
    if (!window.confirm('Permanently remove this listing from the market?')) return;

    try {
      const token = localStorage.getItem('trms_token');
      const res = await fetch(`${API_BASE}/api/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMyListings((prev) => prev.filter((p) => p._id !== productId));
      } else {
        alert('Failed to remove artifact.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('trms_token');
    localStorage.removeItem('trms_user');
    navigate('/login');
  };

  return (
    <div className="w-full min-h-screen pt-16 pb-24 px-4 sm:px-8 text-theme">
      <div className="max-w-[1200px] mx-auto">
        <PageIntro eyebrow="Your campus space" title={user.name || 'Your space'} description={`${user.email || 'Demo account'} · ${user.campusLocation || 'Campus'}`} action={<Link to="/post" className="rounded-xl bg-theme px-5 py-3 text-sm font-semibold text-bg">+ New listing</Link>} />
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Trust score" value={`${user.trustScore ?? 0}/100`} note="Your marketplace reputation" />
          <StatCard label="Active listings" value={myListings.length} note="Items currently visible" />
          <StatCard label="Identity" value={user.status === 'verified' ? 'Verified' : 'Pending'} note={user.campusLocation || 'Campus member'} />
        </div>
        <header className="mb-10 flex flex-col items-start gap-4 border-b border-theme/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-theme/45">Profile details</p>
            <p className="mt-3 text-sm text-theme/55">
              {user.email} | {user.campusLocation}
            </p>
          </div>

          <div className="text-right space-y-4">
            <div>
              <span className="text-[9px] tracking-[0.3em] uppercase text-theme/30 block mb-1.5">Identity Status</span>
              {user.isTrustedSeller ? (
                <span className="text-[9px] tracking-[0.25em] uppercase bg-theme text-bg px-3 py-1.5 inline-block rounded-full">Tier 1 Elite</span>
              ) : user.status === 'verified' ? (
                <span className="text-[9px] tracking-[0.25em] uppercase border border-theme/20 text-theme px-3 py-1.5 inline-block rounded-full">Verified Academic</span>
              ) : (
                <span className="text-[9px] tracking-[0.25em] uppercase text-theme border border-theme/20 px-3 py-1.5 inline-block rounded-full">Unverified</span>
              )}
            </div>
            <div>
              <span className="text-[9px] tracking-[0.3em] uppercase text-theme/30 block mb-1">Trust Score</span>
              <span className="text-3xl font-serif text-theme">
                {user.trustScore ?? 0}<span className="text-base opacity-40">/100</span>
              </span>
            </div>
          </div>
        </header>

        <div>
          <p className="text-[9px] tracking-[0.4em] uppercase text-theme/30 mb-8">Your Active Listings ({myListings.length})</p>

          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-[10px] tracking-[0.4em] uppercase text-theme/30 animate-pulse">Loading Journal...</p>
            </div>
          ) : myListings.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center border border-dashed border-theme/20 rounded-[2rem] gap-4">
              <p className="text-[9px] tracking-widest uppercase text-theme/30">No active consignments.</p>
              <Link to="/post" className="text-[9px] tracking-widest uppercase text-theme underline underline-offset-4">
                Consign your first item &rarr;
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
              {myListings.map((product) => (
                <div key={product._id} className="group flex flex-col">
                  <Link to={`/product/${product._id}`}>
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[1.5rem]">
                      <ProductImage src={product.images?.[0]} alt={product.title} title={product.title} className="h-full w-full transition-transform duration-700 group-hover:scale-105" />
                    </div>
                  </Link>

                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-sm font-serif text-theme truncate pr-2">{product.title}</h3>
                    <span className="text-xs text-theme shrink-0">Rs. {Number(product.price || 0).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center mt-1 mb-3">
                    <StatusPill tone={product.status === 'active' ? 'good' : 'warn'}>{product.status}</StatusPill>
                    {product.isVerifiedProduct ? (
                      <span className="text-[7px] tracking-[0.2em] uppercase text-theme/60">Authenticated</span>
                    ) : (
                      <span className="text-[7px] tracking-[0.2em] uppercase text-theme/40">Pending</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleRemoveListing(product._id)}
                    className="text-[8px] tracking-[0.3em] uppercase text-theme/50 hover:opacity-60 transition-opacity pt-2 border-t border-theme text-right"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-20 text-center border-t border-theme pt-12">
          <button onClick={handleLogout} className="text-[9px] tracking-[0.4em] uppercase text-theme/50 hover:opacity-60 transition-opacity">
            Sever Connection & Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
